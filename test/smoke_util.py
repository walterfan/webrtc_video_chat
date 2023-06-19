import logging
import os
import sys

LOGGER_MAP = {}

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