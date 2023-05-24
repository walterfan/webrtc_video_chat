#!/usr/bin/env python3

import os
import sys
import logging
import json
import paramiko
import socket
from pytz import timezone
from datetime import datetime

LOGGER_MAP = {}
WEBRTC_HOST_ENV_VAR = 'WEBRTC_SERVICE_HOST'

def str2time(str, date_format='%Y-%m-%d %H:%M:%S.%f'):
    return datetime.strptime(str, date_format).astimezone(timezone('UTC'))

def get_host_ip():
    try:
        # get local ip, assuming test bed running on this VM too
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        local_ip = s.getsockname()[0]
    finally:
        s.close()

    return local_ip

def get_webrtc_service_ip(test_config={}):
    webrtc_host = os.getenv(WEBRTC_HOST_ENV_VAR)
    if webrtc_host:
        return webrtc_host
    return test_config.get('webrtc_service', {}).get('host')

def get_webrtc_service_url(test_config={}):
    webrtc_host = os.getenv(WEBRTC_HOST_ENV_VAR)
    if webrtc_host:
        return "https://{}:8043".format(webrtc_host)
    return test_config.get('webrtc_service_url')

def get_logger(filename):
    logger = LOGGER_MAP.get(filename)
    if logger:
        return logger
    else:
        logger = create_logger(filename)
        LOGGER_MAP[filename] = logger
        return logger

def create_logger(filename, log2console=True, logLevel=logging.INFO,  logFolder= './logs'):
    logger = logging.getLogger(filename)
    logger.setLevel(logging.INFO)
    formatstr = '%(asctime)s - [%(filename)s:%(lineno)d] - %(levelname)s - %(message)s'
    formatter = logging.Formatter(formatstr)

    logfile = os.path.join(logFolder, filename)
    if not logfile.endswith(".log"):
        logfile += ".log"

    directory = os.path.dirname(logfile)
    if not os.path.exists(directory):
        os.makedirs(directory)

    handler = logging.FileHandler(logfile)
    handler.setLevel(logLevel)
    handler.setFormatter(formatter)
    logger.addHandler(handler)

    if log2console:
        handler2 = logging.StreamHandler(sys.stdout)
        handler2.setFormatter(logging.Formatter(formatstr))
        handler2.setLevel(logLevel)
        logger.addHandler(handler2)
    return logger

def parse_json(file_name: str) -> dict:
    """" parse json and return dict """
    with open(file_name, 'r', encoding='utf_8') as f:
        client_info_dict = {}
        try:
            client_info_dict = json.load(f)
        except:
            print('{} is not a json file'.format(file_name))
            exit(0)

        return client_info_dict

def execute_remote_command(host, username, password, command, print_cmd = False):

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, username=username, password=password)
    if print_cmd:
        print(command)
    stdin, stdout, stderr = client.exec_command(command)
    output = stdout.read()
    error = stderr.read()

    if error:
        print("execute_remote_command {} error: {}".format(command, error))

    client.close()
    return output

def download_file(host, username, password, remote_file, local_file):

    ssh_client = paramiko.SSHClient()
    ssh_client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh_client.connect(host, username=username, password=password)

    ftp_client = ssh_client.open_sftp()
    ftp_client.get(remote_file, local_file)
    ftp_client.close()

    ssh_client.close()

def upload_file(host, username, password, local_file, remote_file):

    ssh_client = paramiko.SSHClient()
    ssh_client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh_client.connect(host, username=username, password=password)

    ftp_client = ssh_client.open_sftp()
    ftp_client.put(local_file, remote_file)
    ftp_client.close()

    stdin, stdout, stderr = ssh_client.exec_command("ls -l {}".format(remote_file))

    for line in stdout:
        print(line.strip('\n'))

    ssh_client.close()



def numbers_to_string(numbers):
    return ",".join(str(n) for n in numbers)

