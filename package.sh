#!/bin/bash
PACKAGE_NAME=kintone-autokana

BASE_DIR=$(dirname $0)
if [[ $BASE_DIR =~ ^\. ]] ; then
  BASE_DIR=$(pwd)/$BASE_DIR
fi

OPTION=$1
SRC_DIR=$BASE_DIR/src
PACKAGE_DIR=$SRC_DIR/$PACKAGE_NAME
SDK_DIR=$BASE_DIR/plugin-sdk-master
PLUGIN_FILE=$SDK_DIR/plugins/*/plugin.zip
RELEASE_DIR=$BASE_DIR/release

cd $SRC_DIR
pwd

keyfile=""
if [ -d $SDK_DIR/keys ] ; then
  keyfile=$(find $SDK_DIR/keys -name "$PACKAGE_NAME.*.ppk" | head -1)
fi

if [ "$keyfile" == "" ] ; then
  echo "[Package:first]"
  $SDK_DIR/package.sh $PACKAGE_DIR
else
  echo "[Package:repeat]"
  $SDK_DIR/package.sh $PACKAGE_DIR $keyfile
fi

cd $BASE_DIR

if [ "$OPTION" == "release" ] ; then
  cp $PLUGIN_FILE $RELEASE_DIR/$PACKAGE_NAME.zip
  echo "[Package:release]"
fi
