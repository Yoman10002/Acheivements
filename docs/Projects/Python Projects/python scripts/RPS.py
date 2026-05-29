import random
import time
import os

choices = ["Rock", "Paper", "Scissors"]


def RPS():
    while True:
        os.system('cls' if os.name == 'nt' else 'clear')
        print("choose")
        print("1. Rock")
        print("2. Paper")
        print("3. Scissors")
        c = int(input(": ")) - 1
        if c == 1233:
            break
        elif int(c) > 3 or int(c) < 0:
            print("INVALID INPUT2")
            time.sleep(0.7)
            continue
        b = random.randrange(0, 3)
        print("bot chose " + choices[b])
        if choices[c] == choices[b]:
            print("tie")

        elif choices[c] == "Rock" and choices[b] == "Paper" or choices[c] == "Paper" and choices[b] == "Scissors" or choices[c] == "Scissors" and choices[b] == "Rock":
            print("you lost")
        elif choices[b] == "Rock" and choices[c] == "Paper" or choices[b] == "Paper" and choices[c] == "Scissors" or choices[b] == "Scissors" and     choices[c] == "Rock":
            print("you won")
        time.sleep(0.7)    

