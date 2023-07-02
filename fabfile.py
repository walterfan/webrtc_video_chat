import os
import sys
from fabric import task
from fabric import Connection
import time
import json
import logging
import requests
import datetime
import os, subprocess

test_dir = "./webrtc-test"
depot_tool_dir = "/home/ubuntu/depot_tools"
local_webrtc_dir = os.getenv("WEBRTC_SRC")
remote_chrome_dir = "/home/ubuntu/chromium/src"
remote_webrtc_dir = remote_chrome_dir + "/third_party/webrtc"

default_hosts = ["localhost"]
remote_hosts = ["ubuntu@10.224.85.39"]

CHANGE_FILES = """
"""

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


def getChangeList(usegit=False):
    global CHANGE_FILES

    code_dir = local_webrtc_dir

    if usegit:
        stdoutput = subprocess.check_output("cd %s && git status -s -uno" % code_dir, shell=True)
        git_changed_files = stdoutput.decode('utf-8')

        file_list = []
        i = 0
        for git_changed_file in git_changed_files.split('\n'):
            filenames = git_changed_file.strip().split()

            nameLen = len(filenames)
            if nameLen > 1:
                i = i + 1

                if filenames[0] == 'D' or filenames[0] == 'R':
                    continue
                print("%d %s: %s" % (i, filenames[0], filenames[nameLen - 1]))
                file_list.append(filenames[nameLen - 1].strip())

        return file_list

    change_files = []
    change_list = CHANGE_FILES.split("\n")
    for file in change_list:
        change_file = file.strip()
        if len(change_file) == 0 or change_file.startswith("#"):
            continue
        if ":" in change_file:
            change_files.append(change_file.split(":")[1].strip())
        else:
            change_files.append(change_file)

    return change_files


@task(hosts=default_hosts)
def change_files(c, usegit=False, printfile=True):
    """get the change files list

    Args:
        c (connection): local or remote connection
        usegit (bool, optional): use git status or not. Defaults to False.
        printfile (bool, optional): print changed files or not. Defaults to True.

    Returns:
        list: changed files
    """
    files = getChangeList(usegit)
    i = 0
    if printfile:
        for file in files:
            i = i + 1
            print("{}. {}".format(i, file))
    return files

@task(hosts=remote_hosts)
def upload_files(c, usegit=False, dryrun=False, files=""):

    if files:
        change_files = files.split(",")
    else:
        change_files = getChangeList(usegit)

    for file in change_files:
        if not file:
            continue

        src_file = "{}/{}".format(local_webrtc_dir, file)
        dest_file = "{}/{}".format(remote_webrtc_dir, file)

        if dryrun:
            print("upload {} to {}".format(src_file, dest_file))
        else:
            result = c.put(src_file, remote=dest_file)
            print("Uploaded {0.local} to {0.remote}".format(result))

@task(hosts=default_hosts)
def webrtc_update(c):
    c.local("cd {} && git pull".format(local_webrtc_dir))

@task(hosts=default_hosts)
def webrtc_build(c):
    c.local("cd {} && ninja -C out/Default".format(local_webrtc_dir))

@task(hosts=default_hosts)
def module_ut(c, filter, report="module_ut.xml"):
    """usage: fab module-ut -f LossBasedBweV2Test*

    Args:
        filter (string): google test filter
        report (string): google test report
    """
    c.local("cd {}/out/Default && ./modules_unittests --gtest_filter=\"{}\" --gtest_output=\"xml:{}\"".format(local_webrtc_dir, filter, report))

@task(hosts=default_hosts)
def probe_test(c, filter="*Probe*", report="probe_test.xml"):
    module_ut(c, filter, report)

"""
mkdir ~/chromium && cd ~/chromium
fetch --nohooks chromium
cd src
./build/install-build-deps.sh
gclient runhooks
gn args out/Default
gn gen out/Default
autoninja -C out/Default chrome
"""
@task(hosts=remote_hosts)
def chrome_build(c):
    cmd = "cd {} && {}/autoninja -C out/Default chrome".format(remote_chrome_dir, depot_tool_dir)
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

        '--use-fake-ui-for-media-stream',
        '--use-fake-device-for-media-stream',
        '--ignore-certificate-errors',
        '--auto-select-desktop-capture-source=Entire screen',
        "--disable-web-security",
        "--no-default-browser-check",
        "--enable-logging=stderr --v=1",
        "--vmodule=*/webrtc/*=1",
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
def start_chrome_on_mac(c, dryrun=False, canary=True, chrome_path=None, video_file=None):
    if canary:
        chrome_path = "/Applications/Google\\ Chrome\\ Canary.app/Contents/MacOS/Google\\ Chrome\\ Canary"
    else:
        if not chrome_path:
            chrome_path = "/Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome"
    if not video_file:
        video_file = "{}/media/{}".format(os.getcwd(), "akiyo_qcif.y4m")

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

@task(hosts=default_hosts)
def start_selenium_nodes(c, dryrun=False, browser = "chrome"):
    compose_yaml = "docker-compose.yml"
    if browser == "chrome":
        compose_yaml = "standalone-chrome.yml"

    cmd = f"docker-compose -f {compose_yaml} up -d"
    run_cmd(c, cmd, dryrun)
    cmd2 = f"docker-compose -f {compose_yaml} ps"
    run_cmd(c, cmd2, dryrun)

@task(hosts=default_hosts)
def stop_selenium_nodes(c, dryrun=False, browser = "chrome"):
    compose_yaml = "docker-compose.yml"
    if browser == "chrome":
        compose_yaml = "standalone-chrome.yml"

    cmd = f"docker-compose -f {compose_yaml} down"
    run_cmd(c, cmd, dryrun)
    cmd2 = f"docker-compose -f {compose_yaml} ps"
    run_cmd(c, cmd2, dryrun)