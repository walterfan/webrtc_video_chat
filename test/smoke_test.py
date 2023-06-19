#!/usr/bin/env python3
import random
import os
import sys
from time import sleep
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support.ui import Select
from selenium.webdriver.support import expected_conditions as EC
import json
import smoke_util as test_util
import uuid
import argparse


SHORT_TIMEOUT = 1
DEFAULT_TIMEOUT = 5
JS_SNIPPET = "window.open('{}','_blank');"

logger = test_util.get_logger("webrtc_qos_test")

class WebRtcTestApp:
    def __init__(self, node_url, site_url, config):
        self._site_url = site_url
        self._config = config

        self._node_url = node_url
        self._video_path = ""

    def init_app(self):

        self._driver = self.initBrowser("chrome")

    def join(self, room_id=""):
        logger.info("* begin join meeting from %s", self._node_url)
        self._driver.get(self._config['webrtc_internal'])
        sleep(2)

        self._driver.execute_script(JS_SNIPPET.format(self._site_url)) #open new url on new tag
        self._driver.switch_to.window(self._driver.window_handles[1]) #toggle this new tag

        self._driver.get(self._site_url)
        self._driver.maximize_window()

        # join room, start media and call

        logger.info("* joined meeting from %s to %s", self._node_url, self._site_url)


    def call(self):
        join_room_btn = self._driver.find_element(By.ID, "joinRoom");
        join_room_btn.click()

        start_media_btn = self._driver.find_element(By.ID, "startMedia");
        start_media_btn.click()

        call_btn = self._driver.find_element(By.ID, "call");
        call_btn.click()

    def leave(self):
        self._driver.close()


    def destory_app(self):
        self._driver.quit()

    def initBrowser(self, browser_type="chrome"):
        if browser_type == "chrome":
            return self._initChrome()
        else:
            print("TODO for browser {}".format(browser_type))
            return None

    def _initChrome(self):

        ds = {
            'platform': 'ANY',
            'browserName': 'chrome',
            'version': '',
            'javascriptEnabled': True
        }

        chrome_options = webdriver.ChromeOptions()
        chrome_options.add_argument('--ignore-ssl-errors=yes')
        chrome_options.add_argument('--ignore-certificate-errors')

        #chrome_options.add_argument('--allow-file-access-from-files')
        #chrome_options.add_argument('--enable-local-file-accesses')
        #chrome_options.add_argument('--enable-media-stream')
        chrome_options.add_argument('--disable-webrtc-encryption')
        chrome_options.add_argument('--no-default-browser-check')
        chrome_options.add_argument('--use-fake-ui-for-media-stream')

        if self._config.get("video_path"):
            print("use video file: {}".format(self._config["video_path"]))
            chrome_options.add_argument('--use-fake-device-for-media-stream')
            chrome_options.add_argument("--use-file-for-fake-video-capture={}".format(self._config["video_path"]))

        driver = webdriver.Remote(
            command_executor=self._node_url,
            options=chrome_options,
            desired_capabilities=ds
        )

        return driver

class SmokeTester:

    def __init__(self):
        self._clients = {}

    def create_client(self, username, node_url, site_url, test_config):
        test_client = WebRtcTestApp(node_url, site_url, test_config)
        self._clients[username] = test_client
        return test_client


    def test_smoke(self, node_url, site_url, room_id=None, video_path=None):
        logger.info("--- smoke quick test ---")
        testConfig = {
                    "publish_media": ["audio", "video"],
                    "timeout": 10,
                    "resolution": "720p",
                    "webrtc_internal": "chrome://webrtc-internals",
                    "video_path": video_path
                }

        if not room_id:
            room_id = str(uuid.uuid4())

        client1 = self.create_client("alice", node_url, site_url, testConfig)
        client1.init_app()
        client1.join(room_id)

        answer = input("leave meeting {} (y/n)?".format(room_id))
        if answer == 'y':
            client1.leave()
            client1.destory_app()

def smoke_debug(test_case=None):
    logger.info("--- smoke debug {} ---".format(test_case))
    test_config = test_util.parse_json(f'./utils/webrtc_app_config.json')
    tester = qos_tester.WebRtcQosTester(test_config, "qos_logs")
    netem_config = {}
    netem_config['period'] = [5, 10]
    netem_config['subparser_name'] = 'loss'
    netem_config['loss_ratio'] = [5, 10]
    tester.netem_impair_remote(netem_config, "/tmp", "10.224.34.155", "inbound")

def smoke_test(config_file):
    tester = SmokeTester()
    logger.info("# run smoke testing according to configuration file %s", config_file)

    testConfig = cfg.YamlConfig(args.config_file).get_config()
    site_url = test_util.get_webrtc_service_url(testConfig)

    aliceConfig = testConfig.get("participant_first")
    alice = tester.create_client("alice", aliceConfig["selenium_url"], site_url, aliceConfig)

    bobConfig = testConfig.get("participant_second")
    bob = tester.create_client("bob", bobConfig["selenium_url"], site_url, bobConfig)

    room_id = args.room_id
    if not room_id:
        room_id = str(uuid.uuid4())

    tester.join(room_id)

    answer = input("leave meeting {} (y/n)?".format(room_id))
    while answer:
        if answer.strip() == 'y':
            tester.leave()
            logger.info("byebye.")
        else:
            sleep(1)
            answer = input("leave meeting {} (y/n)?".format(room_id))

if __name__ == '__main__':

    parser = argparse.ArgumentParser()
    parser.add_argument('-f', action='store', dest='config_file', help='specify config file name')
    parser.add_argument('-d', "--debug", action='store_true', help='debug for smoke test')
    parser.add_argument('-n', action='store', dest='node_url', help='selenium node url')
    parser.add_argument('-s', action='store', dest='site_url', help='test site url')
    parser.add_argument('-v', action='store', dest='room_id', help='test venue id')
    parser.add_argument('-t', action='store', dest='test_case', help='test case name', default="quick")
    parser.add_argument('-p', action='store', dest='video_path', help='video path')
    args = parser.parse_args()

    if args.config_file:
        smoke_test(args.config_file)

    elif args.debug:
        smoke_debug(args.test_case)
    elif args.node_url and args.site_url:
        tester = SmokeTester()
        room_id = args.room_id
        if not room_id:
            room_id = str(uuid.uuid4())
        tester.test_smoke(args.node_url, args.site_url, room_id, args.video_path)

    else:
        print('usage: ./smoke_test.py -n <selenium_node_url> -s <site_url> [-v <room_id> -f <config_file>]')
        print('e.g. ./smoke_test.py -n http://10.224.85.4:4444/wd/hub -s https://10.224.85.4:8043 -v {} -p "/home/seluser/media/FourPeople_1280x720_60.y4m"'.format(str(uuid.uuid4())))
