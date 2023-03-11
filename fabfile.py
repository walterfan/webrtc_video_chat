import os
import sys
from fabric import task
from fabric import Connection
import time
import json
import logging
import requests
import datetime

code_dir = os.getenv("WEBRTC_SRC")
test_dir = "./webrtc-test"
remote_dir = "/home/walter/workspace/webrtc/webrtc-checkout/src"

default_hosts = ["localhost"]
remote_hosts = ["ubuntu@10.224.122.40"]


def create_logger(filename, log2console=True, logLevel=logging.INFO,  logFolder= './logs'):
    # add log
    #print("Start create logger.")
    logger = logging.getLogger(filename)
    logger.setLevel(logging.INFO)
    formatstr = '%(asctime)s - [%(filename)s:%(lineno)d] - %(levelname)s - %(message)s'
    formatter = logging.Formatter(formatstr)

    logfile = os.path.join(logFolder, filename + '.log')
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
    #print("End create logger.")
    return logger

logger = create_logger("fabric_history")

def run_cmd(c, cmd, dryrun=False, inlocal=True):
    if dryrun:
        print(cmd)
    else:
        if inlocal:
            c.local(cmd)
        else:
            c.run(cmd)

@task(hosts=default_hosts)
def webrtc_update(c):
    c.local("cd {} && git pull".format(code_dir))

@task(hosts=default_hosts)
def webrtc_build(c):
    c.local("cd {} && ninja -C out/Default".format(code_dir))

def modules_unittest(c, filter, report):
    c.local("cd {}/out/Default && ./modules_unittests --gtest_filter=\"{}\" --gtest_output=\"xml:{}\"".format(code_dir, filter, report))

@task(hosts=default_hosts)
def probe_test(c, filter="*Probe*", report="probe_test.xml"):
    modules_unittest(c, filter, report)


@task(hosts=remote_hosts)
def remote_build(c):
    cmd = "cd {} && ninja -C out/Default".format(remote_dir)
    print(cmd)
    c.run(cmd)      


@task(hosts=remote_hosts)
def iperf_listen(c, port=9000):
    cmd =  "iperf3 -s -f m -p {}".format(port)
    print(cmd)
    c.sudo(cmd)

@task(hosts=remote_hosts)
def iperf_connect(c, host, port=9000, type="tcp", wsize="1m", time="300s", interval="1s"):
    cmd =  "iperf3 -c {} -p {} -w {} -t {} -i {}".format(host, port, wsize, time, interval)
    if type == "udp":
        cmd = cmd + " -u -l 1000"
    print(cmd)
    c.sudo(cmd)


@task(hosts=default_hosts)
def start_chrome(c, dryrun=False):
    if dryrun:
        print(sys.platform)
    if sys.platform == "linux" or sys.platform == "linux2":
        start_chrome_on_linux(c, dryrun)
    elif sys.platform == "darwin":
        start_chrome_on_mac(c, dryrun)
    elif sys.platform == "win32":
        start_chrome_on_win(c, dryrun)

def build_chrome_cmd(chrome_path, video_file):
    chrome_options = [
        "--ignore-certificate-errors",
        "--disable-web-security",
        "--no-default-browser-check",
        "--enable-logging=stderr --v=1",
        "--vmodule=*/webrtc/*=1",
        "--use-fake-device-for-media-stream",
        "--use-file-for-fake-video-capture={}".format(video_file)
    ]
    cmd_options = ""
    for option in chrome_options:
        cmd_options = cmd_options + " " + option
    current_time = datetime.datetime.now().strftime("%Y%m%d_%H%M")
    cmd = "{} {} > chrome_debug_{}.log 2>&1".format(chrome_path, cmd_options, current_time)
    print(cmd)
    return cmd

@task(hosts=default_hosts)
def start_chrome_on_linux(c, dryrun=False, chrome_path=None, video_file=None):
    if not chrome_path:
        chrome_path ="/home/ubuntu/chromium/src/out/Default/chrome"
    if not video_file:
        video_file = "/home/ubuntu/FourPeople_1280x720_60.y4m"

    chrome_cmd = build_chrome_cmd(chrome_path, video_file)
    run_cmd(c, chrome_cmd, dryrun)

@task(hosts=default_hosts)
def start_chrome_on_win(c, dryrun=False, chrome_path=None, video_file=None):
    pass

@task(hosts=default_hosts)
def start_chrome_on_mac(c, dryrun=False, chrome_path=None, video_file=None):
    if not chrome_path:
        chrome_path = "/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome"
    if not video_file:
        video_file = "/Users/yafan/Downloads/FourPeople_1280x720_60.y4m"

    chrome_cmd = build_chrome_cmd(chrome_path, video_file)
    run_cmd(c, chrome_cmd, dryrun)


@task(hosts=default_hosts)
def start_selenium_server(c, dryrun=False, selenium_path = "."):
    file_name = "selenium-server-4.8.0.jar"
    file_path = "{}/{}".format(selenium_path, file_name)
    url = "https://github.com/SeleniumHQ/selenium/releases/download/selenium-4.8.0/" + file_name
    if not os.path.exists(file_path):
        print("download from {} ...".format(url))
        response = requests.get(url)
        with open(file_path, 'wb') as f:
            f.write(response.content)
    cmd = "nohup java -jar {} standalone > selenium_server.log 2>&1 &".format(file_path)
    run_cmd(c, cmd, dryrun)