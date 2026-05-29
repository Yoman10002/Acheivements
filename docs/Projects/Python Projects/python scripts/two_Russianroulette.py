import random

chambers = [0] * 5 + [1]  # One bullet in one of the six chambers
random.shuffle(chambers)  # Spin the cylinder


def pull_trigger():
    global chambers
    result = chambers.pop()  # Simulate pulling the trigger
    if result == 1:
        return True  # The player gets shot
    else:
        return False  # The player survives


def two_Russianroulette():
    players = ["Player 1", "Player 2"]
    current_player = 0  # Index to track which player's turn it is

    while True:
        print(f"{players[current_player]}'s turn:")
        c = input("Press Enter to pull the trigger... ")
        if c == "exit":
            break
        elif pull_trigger():
            print(f"Bang! {players[current_player]} has been shot.")
            break
        else:
            print("Click! You survived.")
            if not chambers:
                print("All chambers are empty. Both players survived!")
                break

        # Switch to the other player
        current_player = (current_player + 1) % 2

