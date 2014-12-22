# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure("2") do |config|
  
  config.ssh.shell = "bash -c 'BASH_ENV=/etc/profile exec bash'"
  config.vm.box = "precise64"
  config.vm.box_url = "http://files.vagrantup.com/precise64.box"
  config.vm.provision "shell", path: "tools/bootstrap-vagrant.sh"
  config.vm.network :forwarded_port, host: 8080, guest: 8080
  config.vm.provision "shell", path: "tools/stop-docker-vagrant.sh", run: "always"
  config.vm.provision "shell", path: "tools/start-docker-vagrant.sh", run: "always"

end