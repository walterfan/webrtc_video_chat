#!/usr/bin/env python3

import random
import pytest
import os
import sys
from time import sleep
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support.ui import Select
from selenium.webdriver.support import expected_conditions as EC
import json
import logging
import signal
import uuid

class TestClient:
    def __init__(self, name, node_url):
        self._name = name
        self._node_url = node_url

        self._config = {
            "ice_server_url": "stun:www.fanyamin.com:3478"
        }

        self._driver = self.create_driver(self._node_url)
        self._driver.maximize_window()
        self._driver.implicitly_wait(20)

    def create_driver(self, node_url):

        chrome_options = webdriver.ChromeOptions()
        chrome_options.add_argument('--ignore-ssl-errors=yes')
        chrome_options.add_argument('--ignore-certificate-errors')

        chrome_options.add_argument('--allow-file-access-from-files')
        chrome_options.add_argument('--enable-local-file-accesses')
        chrome_options.add_argument('--enable-media-stream')
        chrome_options.add_argument('--disable-webrtc-encryption')
        chrome_options.add_argument('--no-default-browser-check')
        chrome_options.add_argument('--use-fake-ui-for-media-stream')
        chrome_options.add_argument('--use-fake-device-for-media-stream')

        driver = webdriver.Remote(
            command_executor=node_url,
            options=chrome_options
        )

        return driver

    def join(self, room_id, site_url, room_url):

        self._driver.get(site_url)
        self._config["room_url"] = room_url

        room_id_txt = self._driver.find_element(By.ID, "roomId")
        room_id_txt.clear()
        room_id_txt.send_keys(room_id)

        config_txt = self._driver.find_element(By.ID, "cfgMessage")
        config_txt.clear()
        config_txt.send_keys(json.dumps(self._config, indent = 4))

        join_btn = self._driver.find_element_by_id("joinRoom")
        join_btn.click()

        start_btn = self._driver.find_element_by_id("startMedia")
        start_btn.click()

        call_btn = self._driver.find_element_by_id("call")
        call_btn.click()


    def leave(self):
        self._driver.quit()

class TestCall:
    def setup(self):
        self.clients = {}
        self.clients["Alice"] = TestClient('Alice', 'http://10.224.85.4:4444/wd/hub')
        self.clients["Bob"]   = TestClient('Bob', 'http://10.224.85.242:4444/wd/hub')

    def test_call(self):

        site_url = 'https://10.224.85.4:8043'
        room_url = "wss://10.224.85.4:8003"
        room_id = str(uuid.uuid4())
        self.clients["Alice"].join(room_id, site_url, room_url)
        self.clients["Bob"].join(room_id, site_url, room_url)

        for name, client in self.clients.items():
            print("{} join room {}/{} on {}".format(name, room_id, room_url, site_url))
            client.join(room_id, site_url, room_url)

        sleep(900)


    def teardown(self):
        for name, client in self.clients.items():
            print("{} leave room".format(name))
            client.leave()


if __name__ == '__main__':
    pytest.main(['-s', '-q', '--html=./report.html'])