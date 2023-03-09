import os
import sys
from fabric import task
from fabric import Connection
import time
import json

import logging


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


@task(hosts=remote_hosts)
def start_chrome(c):
    cmd = "/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome"
    cmd_options = """
    --enable-logging=stderr
    --v=1
    --vmodule="*/webrtc/*=1"
    --use-fake-device-for-media-stream
    --use-file-for-fake-video-capture=/Users/yafan/Downloads/FourPeople_1280x720_60.y4m
    > chrome_debug.log
    2>&1
    """
    list_options = cmd_options.split("\n")
    for the_option in list_options:
        cmd = cmd + " " + the_option.strip()
    print(cmd)
    c.local(cmd)