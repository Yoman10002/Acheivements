import random
import time
import os


def display_sequence(sequence):
    print("Memorize this sequence:")
    print(" ".join(map(str, sequence)))
    time.sleep(2)  # Show the sequence for 2 seconds

    # Clear the screen (works for most operating systems)
    os.system('cls' if os.name == 'nt' else 'clear')


def memory_game():
    print("Welcome to the Memory Matching Game!")
    print("Try to remember and repeat the sequences.")

    score = 0
    sequence = []

    while True:
        randnum = random.randrange(0,10)
        print(randnum)
        sequence.append(randnum)  # Add a random digit to the sequence
        display_sequence(sequence)

        # Get the player's guess
        guess = input("Enter the sequence (e.g., 1 2 3): ").split()

        # Convert the guess into a list of integers
        guess = [int(num) for num in guess]

        # Check if the guess matches the sequence
        if guess == "exit":
            break
        elif guess == sequence:
            score += 1
            print("Correct! The sequence gets longer...")
        else:
            print(f"Wrong! The correct sequence was: {' '.join(map(str, sequence))}")
            print(f"Game Over! Your final score: {score}")
            time.sleep(2)
            break


