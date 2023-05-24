import os
import test_util
BASE_PATH = os.path.abspath(os.path.join(os.getcwd()))

class WebRtcTestEnv:
    def __init__(self, test_bed_name, config_file = "webrtc_test_env.json"):
        self._test_bed_name = test_bed_name
        test_beds_config = test_util.parse_json("{}/config/{}".format(BASE_PATH, config_file))
        self._test_bed_config = test_beds_config.get(test_bed_name)

    def get_server_config(self, item_name):
        server_config = self._test_bed_config.get("server", {})
        return server_config.get(item_name)

    def get_client_config(self, sn, item_name):
        client_configs = self._test_bed_config.get("clients", [])
        if len(client_configs) < sn + 1:
            return ""

        client_config = client_configs[sn]
        return client_config.get(item_name)

    def get_server_url(self):
        return self.get_server_config("url")

    def get_server_host(self):
        return self.get_server_config("host")

    def get_server_username(self):
        return self.get_server_config("username")

    def get_server_password(self):
        return self.get_server_config("password")

    def get_server_interface(self):
        return self.get_server_config("interface")

    def get_server_command(self):
        return self.get_server_config("command")

    def get_client_selenium_url(self, sn):
        return self.get_client_config(sn, "selenium_url")

    def get_client_download_url(self, sn):
        return self.get_client_config(sn, "download_url")
