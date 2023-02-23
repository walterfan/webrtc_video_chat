import argparse
import json
import subprocess
import requests
import os
from flask import Flask, send_file, request
from flask_httpauth import HTTPTokenAuth
from flask_cors import CORS
from Utils import Utils
from CommandResult import CommandResult

app = Flask(__name__)
CORS(app, expose_headers='*')
auth = HTTPTokenAuth(scheme='Bearer')

tokens = {
    "controller": "agent"
}


class Dto(object):
    def to_json(self):
        return json.dumps(self.__dict__)

    @classmethod
    def from_json(cls, json_str):
        json_dict = json.loads(json_str)
        return cls(**json_dict)

class CommandRequest(Dto):
    def __init__(self, sn, name, params):
        self.sn = sn
        self.name = name
        self.params = params

    def __str__(self):
            return "{0} {1} {2}".format(self.sn, self.name, self.params)


class CommandResponse(Dto):
    def __init__(self, sn, code, desc):
        self.sn = sn
        self.resultCode = code
        self.description = desc

    def __str__(self):
            return "{0} {1} {2}".format(self.sn, self.resultCode, self.description)


@auth.verify_token
def verify_token(token):
    print(token)
    if token in tokens:
        return tokens[token]


@app.route('/api/v1', methods=['POST'])
@auth.login_required
def ping():  # put application's code here
    return CommandResult(1, 200, "OK").to_json()


# TODO:support command parameters and multiple commands
@app.route('/api/v1/commands', methods=['POST'])
@auth.login_required
def exec_command():
    data = request.json
    dataDict = json.loads(str(data).replace("'", "\""))
    ret = subprocess.run(dataDict['command'], shell=True, stdout=subprocess.PIPE,
                         stderr=subprocess.PIPE,
                         encoding='utf-8')
    if ret.returncode == 0:
        return CommandResult(ret.returncode, ret.stdout).to_json()
    else:
        return CommandResult(ret.returncode, ret.stderr).to_json()


@app.route('/api/v1/download')
@auth.login_required
def download_file():
    if request.args.get('filetype') == 'pcap':
        return send_file(request.args.get('filename') + '.pcap')

    return CommandResult('1', 'can not download file').to_json()



@app.route('/api/v1/ping', methods=['GET'])
@auth.login_required
def ping():
    return CommandResult('0', 'agent is alive'))


# parser command args
parser = argparse.ArgumentParser()
parser.add_argument('-i', '--ip', default='127.0.0.1', nargs='*', help='controller ip', dest='controller_ip')
parser.add_argument('-cp', '--controller_port', default='5000', nargs='*', help='controller port',
                    dest='controller_port')
parser.add_argument('-ap', '--agent_port', default='5000', nargs='*', help='controller port', dest='agent_port')

args = parser.parse_args()


def read_command_param_ip():
    return args.controller_ip


def read_command_param_controller_port():
    return args.controller_port


def read_command_param_agent_port():
    return args.agent_port


# TODO:set a timer to refresh the registration every 5s or other interval
# send http request to controller
def register(controller_ip, controller_port):
    apiPort = os.getenv('API_PORT')
    print('apiPort:' + apiPort)
    vncPort = os.getenv('VNC_PORT')
    print('vncPort:' + vncPort)
    hostIp = os.getenv('HOST_IP')
    print('hostIp:' + hostIp)
    if apiPort is None or vncPort is None or hostIp is None:
        print('Key parameters Yes, please check the input parameters')
        return
    params = {
        "ip": hostIp,
        "apiPort": apiPort,
        "vncPort": vncPort
    }
    try:
        res = requests.post('http://' + controller_ip + ':' + controller_port + '/ap1/v1/ping', params)
        print(res.status_code)
    except:
        print('Can not connect to controller')


if __name__ == '__main__':
    controller_ip = read_command_param_ip()
    controller_port = read_command_param_controller_port()
    register(controller_ip, controller_port)
    app.run(host='0.0.0.0', port=read_command_param_agent_port(), debug=False)
