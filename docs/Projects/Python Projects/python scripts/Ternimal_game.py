import os
import platform
import GPUtil
import psutil
import time
import random
from getpass import getpass
from colorama import Fore, Back, Style
from datetime import datetime
from playsound import playsound

folder_path = r"E:\Atharv\python folders\python scripts\USER FOLDERS"
if not os.path.exists(folder_path): 
    os.makedirs(folder_path) 
cpu_model = platform.processor()
gpus = GPUtil.getGPUs()
ram_info = psutil.virtual_memory()
total_ram = ram_info.total / (1024 ** 3)
total_storage = 0
disk_partitions = psutil.disk_partitions()
    
for partition in disk_partitions:
    try:
        usage = psutil.disk_usage(partition.mountpoint)
        total_storage += usage.total
    except (PermissionError, OSError):
        continue
    total_storage += usage.total

total_storage_gb = total_storage / (1024 ** 3)    


password = "lol"
permission = "user"
files = []
downloads = ["help","textcolor"]
cantuninstall = ["sudo", "clear", "crash"]
notdownloaded = ["time","sounds"]
def loading(inp):
    for a in range(1, random.randrange(1, 4)):
        for i in range(1, 4):
            print(str(inp) + ("." * i))
            time.sleep(0.1)
    print(str(inp) + " complete")        

def change_password():
    global password
    c = getpass("password: ")
    if c == password:
        password = getpass("new password: ")


def check_if_list_contains_val(a, i):
    if i in a: 
        return True 
    else: 
        return False


def show_sudo():
    print("1. install")
    print("2. uninstall")
    print("press enter to go back")
    try:
        c = str(input("sudo >>> "))
        if c == "1":
            if len(notdownloaded) > 0:
                print("INDEX     NAME")
                for i in range(0, len(notdownloaded)):
                    print(str(i + 1) + " " * 9 + notdownloaded[i])
                try:
                    c = int(input("sudo install>>> ")) - 1
                    loading("instaling")
                    if c <= i:
                        downloads.append(notdownloaded[c])
                        notdownloaded.pop(c) 
                    else:
                        pass       
                except:
                    pass  
            else:
                print("nothing to install")      
        elif c == "2":
            print("INDEX     NAME")
            for i in range(0, len(downloads)):
                    print(str(i + 1) + " " * 9 + downloads[i])
            if permission == "admin":
                for a in range(0, len(cantuninstall)):
                    print(str(a + len(downloads) + 1) + " " * 9 + cantuninstall[a])        
            try:
                c = int(input("sudo uninstall>>> ")) - 1
                if c <= i:
                    loading("uninstaling")
                    notdownloaded.append(downloads[c])
                    downloads.pop(c)
                else:
                    if  c > i and c < len(cantuninstall) + 1:
                        if permission == "admin":
                            loading("uninstaling")
                            notdownloaded.append(cantuninstall[c - 2])
                            cantuninstall.pop(c - len(downloads))        
            except:
                pass
    except:
        pass


def change_perm():
    global password
    global permission
    c = getpass("password: ")
    if c == password:
        print("1. user")
        print("2. admin")
        try:
            c = int(input(":"))
            if c == 1:
                permission = "user"
            elif c == 2:
                permission = "admin"    
        except:
            pass
    else:
        print("WRONG PASSWORD")    


def show_folders():
    print("INDEX     NAME                    TYPE")
    for i in range(0, len(files)):
        print(str(i + 1) + " " * 9 + files[i] + " " * (24 - len(files[i])) + "File")
    pass


def show_sounds():
    print("1. RICKROLL")
    print("2. FBI OPEN UP")
    print("3. FRENCH MEME")
    print("4. COFFIN DANCE")
    c = str(input("sound index: "))
    if c == "1":
        print("PLAYING")
        playsound('E:\Atharv\python folders\python scripts\RICKROLL.mp3')
    elif c == "2":
        print("PLAYING")
        playsound('E:\Atharv\python folders\python scripts\FBIOPENUP.mp3')
    elif c == "3":
        print("PLAYING")
        playsound('E:\Atharv\python folders\python scripts\FRENCHMEMESONG.mp3')
    elif c == "4":
        print("PLAYING")
        playsound('E:\Atharv\python folders\python scripts\COFFIN DANCE.mp3')
    else:
        print("invalid")    


def text_color():
    print("1. RED")
    print("2. BLUE")
    print("3. white")
    print("4. black")
    print("5. normal")
    lol = str(input("COLOR:"))
    if type(lol) == int:
        if not int(lol) > 5 or int(lol) < 1:
            if lol == 1:
                print(Fore.RED)
            elif lol == 2:
                print(Fore.BLUE)
            elif lol == 3:
                print(Fore.WHITE)
            elif lol == 4:
                print(Fore.BLACK)        
            elif lol == 5:
                print(Style.RESET_ALL)    
        else:
            print("invalid")


def file():
    global file_path
    global folder_path
    global files
    file_name = ""
    if file_name == "":
        file_name = "a.txt"  
    file_path = os.path.join(folder_path, file_name)    
    files = []      
    for path in os.listdir(folder_path):
        # check if current path is a file
        if os.path.isfile(os.path.join(folder_path, file_path)):
            files.append(path)
    while True:
        os.system('cls' if os.name == 'nt' else 'clear')
        if file_name == "":
                file_name = "a.txt"  
        file_path = os.path.join(folder_path, file_name)
        print("INDEX     NAME                    TYPE")
        i = 0
        for i in range(0, len(files)):
            if files[i] == "a.txt":
                continue
            print(str(i) + " " * 9 + files[i] + " " * (24 - len(files[i])) + "File")
        print("Options-")
        print("1. new file")
        print("2. remove file")
        print("3. edit files")
        print("4. reload")
        print("5. exit")
        c = str(input(">>> "))
        if c == "1":
            file_name = input("file name: ")
            file_path = os.path.join(folder_path, file_name)
            c = input("file content: ")
            with open(file_path, 'w') as f: 
                f.write(c)
        elif c == "2":
            print("INDEX     NAME                    TYPE")            
            for i in range(0, len(files)):
                    if files[i] == "a.txt":
                        continue
                    print(str(i) + " " * 9 + files[i] + " " * (24 - len(files[i])) + "File")
            print("file to delete(c to cancel)")        
            c = input(">>>")
            if c == "c":
                break
            else:
                file_name = files[int(c)]  
                file_path = os.path.join(folder_path, file_name)                  
                os.remove(file_path)        
        elif c == "3":
            while True:
                os.system('cls' if os.name == 'nt' else 'clear')
                print("INDEX     NAME                    TYPE")
                for i in range(0, len(files)):
                    if files[i] == "a.txt":
                        continue
                    print(str(i) + " " * 9 + files[i] + " " * (24 - len(files[i])) + "File")
                try:
                    c = int(input(">>> "))
                except:
                    print("invalid")
                    continue    
                file_name = files[c]
                file_path = os.path.join(folder_path, file_name)
                print("1. content of file")
                print("2.write to file")
                print("3. exit")
                c = str(input(">>> "))
                if c == "1":
                    b =""
                    print("file contents\n") 
                    f = open(file_path, 'r') 
                    c = f.read()
                    f.close()
                    i = 0
                    b = ""
                    for i in range(0, len(c)):
                        if c[i] == "|":
                            print(b)
                            b = ""
                            continue
                        b = b + c[i]    
                    print(b)            
                    input()
                elif c == "2":
                    c = input("overwrite?(y/n): ")
                    if c == "y":
                        print("hint: use | for leaving a blank space between two words")
                        f = open(file_path, 'r') 
                        print(f.read())
                        f.close()
                        c = input("with: ")
                        f = open(file_path, 'w')
                        f.write(c)
                        f.close
                elif c == "3":
                    break        
        elif c == "4":
            if file_name == "":
                file_name = "a.txt"  
            file_path = os.path.join(folder_path, file_name)
            files = []
            for path in os.listdir(folder_path):
                if os.path.isfile(os.path.join(folder_path, file_path)):
                    files.append(path)
        elif c == "5":
            break                            


def Ternimal_game():
    print(Style.RESET_ALL)
    os.system('cls' if os.name == 'nt' else 'clear')
    print("type 'help' for help")
    print("copyright of GC, version 1.3.7")
    while True:
        c = input(">>> ")
        if c == "help" and check_if_list_contains_val(downloads, "help"):
            print("crash or EXIT - to crash (to end the game)")
            print("clear - to clear console")
            print("sudo - to install/uninstall commands")
            print("showdownloads - to see downloaded commands")
            print("time - to show real time")
            print("textcolor - to change text color")
            print("sounds - shows list of sound")
            print('files - able to make files in ur computer')

        elif c == "pcinfo":
            print(f"CPU Model: {cpu_model}")
            if not gpus:
                print("INTEGRATED")
            else:
                for gpu in gpus:
                    print(f"GPU Model: {gpu.name}")
            print(f"Total RAM: {total_ram:.2f} GB")
            print(f"Total Storage: {total_storage_gb:.2f} GB")    
        
        elif c == "EXIT":
            print(Style.RESET_ALL)
            break

        elif c == "reset" or c == "RESET":
            Ternimal_game()

        elif c == "sudo":
            if check_if_list_contains_val(cantuninstall, "sudo"):
                show_sudo()
            else:
                print("softlocked to downloading")
                print("ANTI-SOFTLOCK -")
                print("1. download sudo")
                print("2. continue")
                try:
                    c = int(input(">>> "))
                    if c == 1:
                        cantuninstall.append("sudo")
                        notdownloaded.remove("sudo")
                    elif c == 2:
                        pass
                    else:
                        print("invalid input")    
                except:
                    pass    

        elif c == "permissions":
            change_perm()    

        elif c == "changepassword":
            change_password()    

        elif c == "show_downloads":
            print("DOWNLOADED")
            for i in range(len(downloads)):
                print(downloads[i])
            print("")
            print("NOT DOWNLOADED")    
            for i in range(len(notdownloaded)):    
                print(notdownloaded[i])    

        elif c == "clear":
            if check_if_list_contains_val(cantuninstall, "clear"):
                os.system('cls' if os.name == 'nt' else 'clear')
            else:
                print("NOT INSTALLED")    

        elif c == "time":
            if check_if_list_contains_val(downloads, "time"):
                current_time = datetime.now().strftime("%I:%M:%S %p")
                print("Current Time:", current_time)
            else:
                print("NOT INSTALLED")                

        elif c == "sounds":
            if check_if_list_contains_val(downloads, "sounds"):
                show_sounds()
            else:
                print("NOT INSTALLED")                

        elif c == "textcolor":
            if check_if_list_contains_val(downloads, "textcolor"):
                text_color()    
            else:
                print("NOT INSTALLED")      
        elif c == "files":
            file()
        else:
            print("invaild command")
            continue
