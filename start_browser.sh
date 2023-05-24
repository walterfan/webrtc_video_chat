#!/usr/bin/env bash
mkdir -p ./logs
uname_out="$(uname -s)"
case "${uname_out}" in
    Linux*)     machine=linux;;
    Darwin*)    machine=mac;;
    CYGWIN*)    machine=cygwin;;
    MINGW*)     machine=minGw;;
    *)          machine="unknown:${uname_out}"
esac

options=('--enable-logging=stderr' '--v=1' \
'--vmodule="*/webrtc/*=1"' \
'--vmodule="*third_party/libjingle/*=1"' \
'--use-fake-ui-for-media-stream' \
'--use-fake-device-for-media-stream' \
'--ignore-certificate-errors' \
'--auto-select-desktop-capture-source=Entire screen' \
'> ./logs/chrome_debug.log 2>&1')

if [[ ${machine} == "linux" ]]; then
  cmd="/home/ubuntu/chromium/src/out/Default"
  echo "${cmd}"
elif [[ ${machine} == "mac" ]]; then
  cmd="/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome"

  for str in ${options[@]}; do
    cmd="${cmd} ${str}"
  done

  echo $cmd


else
  echo "${machine} is not supported"
fi


