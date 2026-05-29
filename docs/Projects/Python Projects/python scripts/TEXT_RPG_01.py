import random
import os
import time

temp = 0
m_hp = 10
hp = m_hp
gold = 0
damage = 1
enemy_spawned = 0
speed = 4 + 1
inventory = {
    "1": "Apple(+2 hp)",
    "1no.": 5,
    "2": "potion",
    "2no.": 0,
}

shop = {
    "1": "Apple",
    "1p": "1",
    "2": "mysterious potion",
    "2p": "5",
    "3": "Damage Upgrade(+2)",
    "3p": "5",
    "3l": "0",
    "4": "Speed Upgrade",
    "4p": "5",
    "4l": "0",
    "5": "max health upgrade(+2)",
    "5p": "4",
    "5l": "0",

}


def TEXT_RPG_01():
    def enemy_spawn(h, val, dmg):
        global enemy_health
        global enemy_val
        global enemy_m_health
        global enemy_t_damage
        global enemy_damage
        global enemy_spawned
        enemy_m_health = h
        enemy_health = enemy_m_health
        enemy_spawned += 1
        enemy_t_damage = dmg
        enemy_damage = enemy_t_damage
        enemy_val = val

    enemy_spawn(5, 2, 1)

    def enemy_action():
        global hp
        if (random.randrange(1, 2)) == 1:
            if (random.randrange(1, 10)) == 1:
                hp -= enemy_damage * 2
                print("enemy hits critical")
            else:
                hp -= enemy_damage

    def show_inventory():
        os.system('cls' if os.name == 'nt' else 'clear')
        global hp
        global m_hp
        global damage
        print("")
        print("your health:", hp, "/", m_hp)
        print("")
        i = 1
        while i <= len(inventory) / 2:
            item = inventory[str(i)]
            i_a = inventory[str(i) + "no."]
            print(str(i) + ". " + item + " - " + str(i_a))
            i += 1
        print("3. close inventory")
        c = input("use item (1/2/3): ")
        if c == "1":
            if not inventory["1no."] == 0:
                i_a = inventory["1no."]
                inventory.update({"1no.": i_a - 1})
                hp += 2
                if hp > m_hp:
                    hp = m_hp
                show_inventory()
            else:
                print("")
                print("no apples left")
                show_inventory()
        elif c == "2":
            if not inventory["2no."] == 0:
                i_a = inventory["2no."]
                inventory.update({"2no.": i_a - 1})
                if hp > m_hp:
                    hp = m_hp
                randnum = int((random.randrange(1, 4)))
                if randnum == 1:
                    hp = m_hp
                    print("full hp healed")
                elif randnum == 2:
                    damage += 2
                    print("+2 damage")
                elif randnum == 3:
                    hp -= 1
                    print("you poisoned your self")
                show_inventory()
            else:
                print("")
                print("no potions left")
                show_inventory()

        elif c == "3":
            if enemy_health <= 0:
                open_shop()
        else:
            print("invalid input")
            show_inventory()

    def open_shop():
        os.system('cls' if os.name == 'nt' else 'clear')
        global gold
        global damage
        global speed
        global m_hp
        i = 1
        print("")
        print("stats-")
        print("  your health:", hp, "/", m_hp)
        print("  damage: " + str(damage))
        print("  speed(1/" + str(speed - 1) + "): " + str(speed - 1))
        print("  your Gold:", gold)
        print("")
        while i <= (len(shop) - 2) / 2:
            item = shop[str(i)]
            i_p = shop[str(i) + "p"]
            if i >= 3:
                lvl = shop[str(i) + "l"]
                print(str(i) + ". " + item + " - " + str(i_p) + " gold ( lvl - " + str(lvl) + ")")
            else:
                print(str(i) + ". " + item + " - " + str(i_p) + " gold ")
            i += 1
            if i == 3:
                print("")
                print("upgrades -")
        print(str(i) + ". close shop")
        print("i for inventory")

        c = input("buy item (1/2/3/4/5/6): ")
        if c == "1":
            print("c to cancel")
            a = input("amount of Apples: ")
            if not a == "c":
                if not int(shop["1p"]) * int(a) > gold:
                    i_p = int(shop["1p"]) * int(a)
                    gold -= i_p
                    inventory.update({"1no.": int(inventory["1no."]) + int(a)})
                    open_shop()
                else:
                    print("")
                    print("not enough gold")
                    open_shop()
            else:
                open_shop()

        elif c == "2":
            print("c to cancel")
            a = input("amount of potions: ")
            if not a == "c":
                if not int(shop["2p"]) * int(a) > gold:
                    i_p = int(shop["2p"]) * int(a)
                    gold -= i_p
                    inventory.update({"1no.": int(inventory["2no."]) + int(a)})
                    open_shop()
                else:
                    print("")
                    print("not enough gold")
                    open_shop()

            else:
                open_shop()

        elif c == "3":
            print("y for yes")
            print("n for no")
            a = input("sure? ")
            if a == "y":
                if not int(shop["3p"]) > gold:
                    i_p = int(shop["3p"])
                    gold -= i_p
                    damage += 2
                    shop.update({"3p": int(shop["3p"]) * 2})
                    shop.update({"3l": int(shop["3l"]) + 1})
                    open_shop()
                else:
                    print("")
                    print("not enough gold")
                    open_shop()
            else:
                open_shop()

        elif c == "4":
            print("y for yes")
            print("n for no")
            a = input("sure? ")
            if a == "y":
                if not int(shop["4p"]) > gold:
                    i_p = int(shop["4p"])
                    gold -= i_p
                    speed -= 0.5
                    shop.update({"4p": round(int(shop["4p"]) * 1.5)})
                    shop.update({"4l": int(shop["4l"]) + 1})
                    open_shop()
                else:
                    print("")
                    print("not enough gold")
                    open_shop()
            else:
                open_shop()

        elif c == "5":
            print("y for yes")
            print("n for no")
            a = input("sure? ")
            if a == "y":
                if int(shop["5p"]) <= gold:
                    i_p = int(shop["5p"])
                    gold -= i_p
                    m_hp += 2
                    shop.update({"5p": round(int(shop["5p"]) * 1.5)})
                    shop.update({"5l": int(shop["5l"]) + 1})
                    open_shop()
                else:
                    print("")
                    print("not enough gold")
                    open_shop()
            else:
                open_shop()

        elif c == "6":
            pass

        elif c == "i":
            show_inventory()

        else:
            if int(c) > 5:
                print("invalid input")
            open_shop()

    while True:
        os.system('cls' if os.name == 'nt' else 'clear')
        global enemy_health
        global enemy_val
        global enemy_m_health
        global enemy_t_damage
        global enemy_damage
        global hp
        global m_hp
        global damage
        global speed
        global gold
        global enemy_spawned
        temp = 0
        print("")
        print("enemy health:", enemy_health, "/", enemy_m_health)
        print("your health:", hp, "/", m_hp)
        print("")
        print("1. slash( damage ", damage, ")")
        print("2. dodge(if succeeded then enemy lose 1 turn, 1/" + str(speed - 1) + " chance)")
        print("3. defend(half the damage)")
        print("4. inventory")
        choice = input("pick action(1/2/3/4): ")
        if choice == "exit":
            break
        elif choice == "1":
            if (random.randrange(1, 5)) == 1:
                enemy_health -= damage * 2
                print("you crit the enemy")
            else:
                enemy_health -= damage
        elif choice == "2":
            if (random.randrange(1, speed)) == 1:
                temp = 2
                print("you dodged attack")
                print(enemy_damage)
        elif choice == "3":
            enemy_damage = enemy_damage / 2
        elif choice == "4":
            show_inventory()
            continue
        else:
            print("")
            print("invalid input")
            continue
        if enemy_health <= 0:
            print("")
            print("enemy killed")
            print("gold earned " + str(enemy_val))
            gold += enemy_val
            print("shop open")
            open_shop()
            if enemy_spawned == 10:
                print("boss fight")
                enemy_spawn(enemy_health + 3, enemy_val + 10, enemy_m_health + 5)
            elif enemy_spawned == 11:
                print("")
                print("boss defeated")
                print("demo complete")
                print("")
                break
            else:
                enemy_spawn(enemy_m_health + 2, enemy_val + 2, enemy_damage + 0.5)

            continue
        if temp == 0:
            enemy_action()
        temp -= 1
        if hp <= 0:
            print("")
            print("Game Over")
            break
        input
