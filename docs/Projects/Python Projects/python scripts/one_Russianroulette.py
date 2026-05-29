import random
import time
i = 0
chambers = [0] * 5 + [1]
random.shuffle(chambers)

def pull_trigger():
    result = chambers.pop()  # Simulate pulling the trigger
    if result == 1:
        return True  # The player gets shot
    else:
        return False  # The player survives


def Russianroulette():
    global i
    while True:
        input("Press 'enter' to pull the trigger")
        if pull_trigger():
            print("Bang! You have been shot.")
            break
        else:
            print("Click! You survived.")
        i += 1
        if i == 5:
            print("You survived")
            print("the bullet is in the last chamber")
            time.sleep(0.5)
            break
        time.sleep(0.5)

