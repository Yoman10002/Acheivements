import getpass
import os
import time
player1 = 0
player2 = 0
player = 0
choices = ["Rock", "Paper", "Scissors"]

def RPS_2():
    global player
    global player1
    global player2
    global choices
    while True:
        os.system('cls')
        player += 1
        if player == 1:
            print("player 1- ")
        elif player == 2:
            print("player 2- ")
        print("1. rock")
        print("2. paper")
        print("3. scissors")
        c = int(getpass.getpass(""))
        if player == 2:
            player = 0
            if choices[player1] == choices[player2]:
                print("tie")
            elif choices[player1] == "Rock" and choices[player2] == "Paper" or choices[player1] == "Paper" and choices[player2] == "Scissors" or choices[player1] == "Scissors" and choices[player2] == "Rock":
                print("player 2 won")
            elif choices[player2] == "Rock" and choices[player1] == "Paper" or choices[player2] == "Paper" and choices[player1] == "Scissors" or choices[player2] == "Scissors" and      choices[player1] == "Rock":
                print("player 1 won")
            time.sleep(1)    
        elif player == 2:
            player2 = c
        elif player == 1:
            player1 = c

