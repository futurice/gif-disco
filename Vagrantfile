# -*- mode: ruby -*-
# vi: set ft=ruby :

# Vagrantfile API/syntax version. Don't touch unless you know what you're doing!
VAGRANTFILE_API_VERSION = "2"

Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
  # All Vagrant configuration is done here. The most common configuration
  # options are documented and commented below. For a complete reference,
  # please see the online documentation at vagrantup.com.

  # Every Vagrant virtual environment requires a box to build off of.
  config.vm.box = "https://cloud-images.ubuntu.com/vagrant/trusty/current/trusty-server-cloudimg-amd64-vagrant-disk1.box"

  # Add usb devices to vagrant box
  config.vm.provider "virtualbox" do |vb|
    vb.customize ['modifyvm', :id, '--usb', 'on']
    vb.customize ["modifyvm", :id, "--usbehci", "on"]
    vb.customize ['usbfilter', 'add', '0', '--target', :id, '--name', 'Logitech Camera', '--vendorid', '0x046d']
    vb.customize ['usbfilter', 'add', '0', '--target', :id, '--name', 'Builtin Camera', '--vendorid', '0x05ac']
  end

  # Forward ports so you can access servers run inside box
  config.vm.network "forwarded_port", guest: 8080, host: 8080
  config.vm.network "forwarded_port", guest: 9000, host: 9000

  # To access gifdisco repository inside box, add synced folder
  # First is directory on host machine, and second is the path to be mounted in vagrant box
  config.vm.synced_folder "~/code", "/code"
end
