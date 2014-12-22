#!/usr/bin/env bash

sudo apt-get update

sudo apt-get install -y build-essential curl dkms linux-image-extra-$(uname -r)
sudo apt-get install -y virtualbox-guest-additions

sudo sh -c "wget -qO- https://get.docker.io/gpg | apt-key add -"
sudo sh -c "echo deb http://get.docker.io/ubuntu docker main\
> /etc/apt/sources.list.d/docker.list"

sudo apt-get update

sudo apt-get install -y lxc-docker

sudo ufw allow 80/tcp
sudo ufw allow 8080/tcp


cd /vagrant
sudo docker build -t plwconsulting/assets-to-pdf .