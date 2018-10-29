import os
from shutil import copyfile
import random
import time

# File menager
def get_work_path(path):
    work_path = path
    todo = ''
    while todo != "t":
        print("Commands: ok, cd <dir>, cd .., ls")
        print("Obecna sciezka: \"{}\"".format(work_path))
        todo = input(">> ")
        # Katalog wczesniej
        if todo[:5] == "cd ..":
            tmp_path = work_path.split("\\")
            dirs = len(tmp_path) - 1
            work_path = ''
            for dir in tmp_path:
                if dir != tmp_path[dirs]:
                    if dir == tmp_path[0]:
                        work_path = work_path + dir
                    else:
                        work_path = work_path + "\\" + dir
            if len(work_path)==2:
                work_path = work_path + "\\"
        # przejdz do
        elif todo[:3] == "cd ":
            if len(work_path)>3:
                tmp_path = work_path + "\\" + todo[3:]
            else:
                tmp_path = work_path + todo[3:]
            if os.path.exists(tmp_path):
                work_path = tmp_path
            else:
                print("Nieprawidlowa sciezka.")
        # Lista katalogow i plikow
        elif todo == "ls":
            dir_list = os.listdir(work_path)        
            print()
            print("----FILE LIST----")
            for file in dir_list:
                print("- {}".format(file))
            print("-----------------")
            
        # Zatwierdz sciezke
        elif todo == "ok":
            todo = "t"
          
    return work_path

# --------------- MINE PROGRAM ---------------- #

todo = ''
# Get current path
work_path = os.getcwd()

# Windows or Unix?
if work_path[1:3] == ":\\":
    print("You have a Windows :) {}".format(work_path[1:3]))

    work_path = get_work_path(work_path)

    while todo != "0":
        os.system('cls')
        # work_path = os.getcwd()
        dir_list = os.listdir(work_path)
        point = -1

        print()
        print("----FILE LIST----")
        for file in dir_list:
            point+=1
            print("{}- {}".format(point,file))

        print()
        print("-----------------")
        print("1. Powielic plik.")
        print("2. Zmien nazwe.")
        print("3. Usun plik.")
        print("4. Zmien scierzke.")
        print("5. Randomize music.")
        print("6. Back Randomize music.")
        print("0. Zakoncz.")
        print("-----------------")
        print()

        todo = input(">> ")

        # Copy
        if todo == "1":
            print("Wybierz plik podajac numer np. 1")
            tmp_file = int(input())
            tmp_file = 0 if tmp_file < 0 else tmp_file
            print("Oryginal: {}".format(work_path + "\\" + dir_list[tmp_file]))
            copyfile(work_path + "\\" + dir_list[tmp_file], work_path + "\\kopia_" + dir_list[tmp_file])
            print("Kopia: {}".format(work_path + "\\kopia_" + dir_list[tmp_file]))

        # Rename
        elif todo == "2":
            print("Wybierz plik podajac numer np. 1")
            tmp_file = int(input())
            tmp_file = 0 if tmp_file < 0 else tmp_file
            print("Wybrany plik: {}. Wprowadz nowa nazwe.".format(work_path + "\\" + dir_list[tmp_file]))
            new_name = input()
            os.rename(work_path + "\\" + dir_list[tmp_file], work_path + "\\" + new_name)
            print("Zmieniono na: {}.".format(work_path + "\\" + new_name))

        # Delete
        elif todo == "3":
            print("Wybierz plik podajac numer np. 1")
            tmp_file = int(input())
            tmp_file = 0 if tmp_file < 0 else tmp_file
            print("Wybrany plik: {}. Napewno usunac? t/n".format(work_path + "\\" + dir_list[tmp_file]))
            todo = input()
            if todo == "t":
                os.remove(work_path + "\\" + dir_list[tmp_file])
                print("Plik zosta skasowany.")
            else:
                print("Anulowano.")
        
        # File menager
        elif todo == "4":
            work_path = get_work_path(work_path)

        # Randomize music
        elif todo == "5":
            howmany = 0
            licznik = 0
            files_list = dir_list
            for x in range(0, len(files_list)):
                licznik = licznik + 1
                rand_int = random.randint(0, len(files_list)-1)
                old_name = work_path + "\\" + files_list[rand_int]
                new_name = work_path + "\\" + str(licznik) + ". " + files_list[rand_int]
                os.rename(old_name, new_name)
                files_list.remove(files_list[rand_int])
                howmany += 1
            input("Randomize: {}. Operation done!".format(howmany))

        # Back Randomize music
        elif todo == "6":
            errors = 0
            licznik = 1
            while licznik!=0:
                errors = 0
                licznik = 0
                files_list = os.listdir(work_path)
                for x in range(0, len(files_list)-1):
                    old_name = work_path + "\\" + files_list[x]
                    new_name = work_path + "\\" + files_list[x]
                    
                    if files_list[x][0] == '.' and files_list[x][1] == ' ':
                        new_name = work_path + "\\" + files_list[x][2:]
                        licznik = licznik + 1
                    
                    elif files_list[x][0] == ' ' or files_list[x][0] == '_' or files_list[x][0] == '-' or files_list[x][0] == '.':
                        new_name = work_path + "\\" + files_list[x][1:]
                        licznik = licznik + 1
                    
                    elif files_list[x][1] == '.' and files_list[x][2] == ' ':
                        new_name = work_path + "\\" + files_list[x][3:]
                        licznik = licznik + 1
                    
                    elif files_list[x][2] == '.' and files_list[x][3] == ' ':
                        new_name = work_path + "\\" + files_list[x][4:]
                        licznik = licznik + 1
                    
                    elif files_list[x][3] == '.' and files_list[x][4] == ' ':
                        new_name = work_path + "\\" + files_list[x][5:]
                        licznik = licznik + 1
                    
                    elif files_list[x][4] == '.' and files_list[x][5] == ' ':
                        new_name = work_path + "\\" + files_list[x][6:]
                        licznik = licznik + 1
                    
                    elif files_list[x][5] == '.' and files_list[x][6] == ' ':
                        new_name = work_path + "\\" + files_list[x][7:]
                        licznik = licznik + 1
                    else:
                        try:
                            ifint = int(files_list[x][0])
                            new_name = work_path + "\\" + files_list[x][1:]
                            licznik = licznik + 1
                        except:
                            ifint = 0

                    if os.path.exists(old_name):
                        os.rename(old_name, new_name)
                    else:
                        errors = errors + 1

                print("Liczba redukcji: {}".format(licznik))
                print("Liczba bledow: {}".format(errors))
            input("Press key...")

        elif todo == "0":
            todo = "0"
        else:
            print("Bledne polecenie!")
            input()
else:
    print("For Unix cooming soon! Maybe xd")
    
os.system('cls')
