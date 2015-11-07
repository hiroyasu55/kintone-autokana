#!/bin/bash
PACKAGE_NAME=kintone-autokana

BASE_DIR=$(dirname $0)
if [[ $BASE_DIR =~ ^\. ]] ; then
  BASE_DIR=$(pwd)/$BASE_DIR
fi

SRC_DIR=$BASE_DIR/src
PACKAGE_DIR=$SRC_DIR/$PACKAGE_NAME
SDK_DIR=$BASE_DIR/plugin-sdk-master

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
