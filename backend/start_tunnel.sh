#!/bin/bash
# Проверяем, не запущен ли уже туннель
if ! pgrep -f "ssh.*3306:localhost:3306" > /dev/null; then
    echo "Запускаем SSH туннель..."
    ssh -f -N -L 3306:localhost:3306 root@81.200.146.77
    echo "SSH туннель запущен"
else
    echo "SSH туннель уже активен"
fi