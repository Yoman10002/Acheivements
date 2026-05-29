import random
import time
import os
from one_Russianroulette import *
from two_Russianroulette import *
from TEXT_RPG_01 import *
from TEXT_RPG_02 import *
from RPS import *
from Ternimal_game import *
from lol import *
from RPS_2 import *

dfile = {
    "devmenu" : "",
    "TEXTRPG" : "",
    "Ternimalgame" : ""
}

def devmenu():
    while True:
        os.system('cls' if os.name == 'nt' else 'clear')
        print("dev menu- ")
        print(" faliures- ")
        print("1. memory game")
        print("2. RPS 2PLAYER")
        c = input(": ")
        if c == "1":
            memory_game()
        elif c == "2":
            RPS_2()
        elif c == "file read":
            print(fileread())
        elif c == "exit":
            break
        time.sleep(0.5)    

def loading(failed):
    print("loading started")
    for a in range(1, random.randrange(2, 5)):
        for i in range(1, 4):
            os.system('cls' if os.name == 'nt' else 'clear')
            print("." * i)
            time.sleep(0.1)
    if failed:
        print("game loaded")
        time.sleep(0.4)
    else:
        print("loading failed") 
        time.sleep(0.4)

def fileread():
    global dfile
    count = 0
    with open("MODIFYME.txt") as fp:
        while True:
            line = fp.readline()
            count += 1
            if not line:
                break
            if count == 1:
                dfile.update({"devmenu": line})
            elif count == 2:
                dfile.update({"TEXTRPG": line})
            elif count == 3:
                dfile.update({"Ternimalgame": line})                                  
        return dfile    


while True:
    fileread()
    os.system('cls' if os.name == 'nt' else 'clear')
    print("WELCOME TO THE GAME CENTER")
    print("")
    print("1. TEXTRPG")
    print("2. Russian Roulette - 1player/2player")
    print("3. ROCK PAPER SCISSORS")
    print("4. Ternimal game")
    try:
        c = str(input("game no.: "))
    except:
        print("ERROR: INVALID INPUT")
        time.sleep(0.4)
        continue
    if c == "1":
        print("1. 0.1")
        print("2. 0.2")
        print("'enter' to back")
        c = input("VERSION: ")
        if c == "1":
            loading(True)
            TEXT_RPG_01()
        elif c == "2":
            loading(True)
            TEXT_RPG_02()
        else:
            continue
    elif c == "2":
        print("1. 1player")
        print("2. 2player")
        c = input("1 player/2player - ")
        if c == "1":
            loading(True)
            Russianroulette()
        elif c == "2":
            loading(True)
            two_Russianroulette()
        else:
            continue
    elif c == "3":
        loading(True)
        RPS()
    elif c == "4":
        loading(True)
        Ternimal_game()
    elif c == "4930" and dfile["devmenu"] == "True\n":
        devmenu()
    elif c == "1234":
        break
    else:
        print("OUT OF RANGE")
        time.sleep(0.4)
        continue
