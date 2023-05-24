import os
import sys

dir_path = os.path.dirname(os.path.realpath(__file__))

# refer to https://pyyaml.org/wiki/PyYAMLDocumentation
from yaml import load, dump

try:
    from yaml import CLoader as Loader, CDumper as Dumper
except ImportError:
    from yaml import Loader, Dumper


def get_home_path():
    return dir_path


class YamlConfig:
    def __init__(self, yaml_file):
        self.config_file = yaml_file
        self.config_data = self.read_config(yaml_file)

    def read_config(self, yaml_file):
        f = open(yaml_file, 'r', encoding='UTF-8')
        config_data = load(f, Loader=Loader)
        f.close()
        return config_data

    def get_config(self):
        return self.config_data

    def __str__(self):
        return dump(self.config_data, Dumper=Dumper)

