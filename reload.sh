 #!/bin/bash

pnpm run build
sudo rm -r /home/$USER/homebrew/plugins/PowerControl/
sudo cp -r /home/$USER/Development/PowerControl/ ~/homebrew/plugins/
sudo systemctl restart plugin_loader.service
