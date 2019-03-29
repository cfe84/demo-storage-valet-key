#!/bin/bash

random() { size=$1; echo -n `date +%s%N | sha256sum | base64 | head -c $size`;}

usage() {
    echo "Usage: `basename "$0"` [--name $NAME] [--location $LOCATION]"
    exit 1
}

PWD=`pwd`
NAME=`basename "$PWD"`
LOCATION="westus2"

while [[ $# -gt 0 ]]
do
    key="$1"
    shift

    case $key in
        -n|--name)
            NAME="$1"
            shift
        ;;
        -l|--location)
            LOCATION="$1"
            shift
        ;;
        *)
            echo "Unknown parameter: $key"
            usage
        ;;
    esac
done


RGNAME="$NAME"
STORAGEBASENAME="`echo -n $NAME | head -c 15``random 5`"
APPSTORAGENAME="`echo "$STORAGEBASENAME" | sed -e 's/-//g' | sed -E 's/^(.*)$/\L\1/g' | head -c 24`"
WEBAPPNAME="$NAME-`random 5`"
UPLOADCONTAINERNAME="demo"
DEPLOYMENTUSERNAME="$WEBAPPNAME"
DEPLOYMENTPASSWORD="`random 30`"

echo "Creating RG $RGNAME"
az group create --name $RGNAME --location $LOCATION --query "properties.provisioningState" -o tsv

echo "Generating cleanup script"
echo "#!/bin/bash

echo 'Removing resource group $RGNAME'
az group delete --name $RGNAME --yes
" > cleanup.sh
chmod +x cleanup.sh

echo "Creating storage account $APPSTORAGENAME"
az storage account create --name $APPSTORAGENAME --kind StorageV2 --location $LOCATION -g $RGNAME --https-only true --query "provisioningState" -o tsv
az storage cors add --methods GET --origins '*' --services b --account-name $APPSTORAGENAME --allowed-headers '*' --max-age 86000
echo "Creating container $UPLOADCONTAINERNAME"
az storage container create --name $UPLOADCONTAINERNAME --account-name $APPSTORAGENAME --query "created" -o tsv
echo "Retrieving keys"
APPSTORAGECONNECTIONSTRING=`az storage account show-connection-string -g $RGNAME -n $APPSTORAGENAME --query connectionString -o tsv`

echo "Generating local settings file"
ESCAPED_APPSTORAGECONNECTIONSTRING=`echo $APPSTORAGECONNECTIONSTRING | sed -e 's/\\//\\\\\\//g'`
cat appsettings.Development.json.template |
	sed "s/_APPSTORAGECONNECTIONSTRING_/$ESCAPED_APPSTORAGECONNECTIONSTRING/g" |
	sed "s/_UPLOADCONTAINERNAME_/$UPLOADCONTAINERNAME/g" \
	> src/appsettings.Development.json

cat src/appsettings.Development.json > src/appsettings.json

echo "Creating app service plan $WEBAPPNAME"
az webapp deployment user set --user-name "$DEPLOYMENTUSERNAME" --password "$DEPLOYMENTPASSWORD" > /dev/null
az appservice plan create -g $RGNAME -n $WEBAPPNAME --sku FREE --location $LOCATION --query "provisioningState" -o tsv
echo "Creating webapp $WEBAPPNAME"
HOSTNAME=`az webapp create -g $RGNAME -n $WEBAPPNAME --plan $WEBAPPNAME --deployment-local-git --query "defaultHostName" -o tsv`
GITURL="https://$DEPLOYMENTUSERNAME:$DEPLOYMENTPASSWORD@$WEBAPPNAME.scm.azurewebsites.net/$WEBAPPNAME.git"
# az webapp config appsettings set --name $WEBAPPNAME -g $RGNAME --settings Storage.ConnectionString="$APPSTORAGECONNECTIONSTRING" Storage.ContainerName="$UPLOADCONTAINERNAME" > /dev/null
echo "Deploying webapp"
git remote add azure "$GITURL"
git push azure master

echo "           Web app name: $WEBAPPNAME"
echo "            Web app url: $HOSTNAME"
echo "        Deployment user: $DEPLOYMENTUSERNAME"
echo "    Deployment password: $DEPLOYMENTPASSWORD"
echo "          Local git url: $GITURL"
echo "        Storage account: $APPSTORAGENAME"
echo "            Storage key: $APPSTORAGECONNECTIONSTRING"
echo "    Resource group name: $RGNAME"
echo "         Container name: $UPLOADCONTAINERNAME"