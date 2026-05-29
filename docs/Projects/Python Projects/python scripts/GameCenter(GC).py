import random
import time
from one_Russianroulette import *
from two_Russianroulette import *
from TEXT_RPG_01 import *
from RPS import *
from Ternimal_game import *
import os


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


while True:
    os.system('cls' if os.name == 'nt' else 'clear')
    print("WELCOME TO THE GAME CENTER")
    print("")
    print("1. TEXTRPG")
    print("2. Russian Roulette - 1player/2player")
    print("3. ROCK PAPER SCISSORS")
    print("4. Ternimal game")
    try:
        c = int(input("game no.: "))
    except:
        print("ERROR: INVALID INPUT")
        time.sleep(0.4)
        continue
    if c == 1:
        print("1. 0.1")
        print("2. 0.2")
        print("'enter' to back")
        c = input("VERSION: ")
        if c == "1":
            loading(True)
            TEXT_RPG_01()
        elif c == "2":
            loading(False)
            print("error 4: file not found")
        else:
            continue
    elif c == 2:
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
    elif c == 3:
        loading(True)
        RPS()
    elif c == 4:
        loading(True)
        Ternimal_game()    
    else:
        print("OUT OF RANGE")
        time.sleep(0.4)
        continue
