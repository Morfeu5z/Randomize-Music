print('>>Loading, just wait few sec, ok?')
import os, sys, time, youtube_dl
os.system('pip install youtube-dl')

runProgram = True

if not os.path.isfile('ffmpeg.exe'):
    print(">>ffmpeg do not found.")
    print(">>Close app.")
    runProgram = False
    input()
else:
    print(">>ffmpeg: OK.")

while runProgram:
    print('Youtube url: ')
    link = str(input())
    if link[0:5] == 'https':
        ytd_opts = {
            'format': 'bestaudio',       
            'outtmpl': 'music\\ytd_tmp',        
            'noplaylist' : True,
        }

        metadata = ['','']
        best_audio = [0, 0]
        with youtube_dl.YoutubeDL(ytd_opts) as ytd:
            meta = ytd.extract_info(link, download=False)
            metadata[0] = meta['title']
            metadata[0] = metadata[0].replace('\\', '')
            metadata[0] = metadata[0].replace('/', '')
            metadata[0] = metadata[0].replace('"', '')
            metadata[0] = metadata[0].replace('|', '')
            metadata[0] = metadata[0].replace('?', '')
            metadata[0] = metadata[0].replace('*', '')
            metadata[0] = metadata[0].replace('<', '')
            metadata[0] = metadata[0].replace('>', '')
            metadata[0] = metadata[0].replace(':', '')
            metadata[1] = meta['uploader']
            metadata[1] = metadata[1].replace(':', ' -')
            print("Title:\t\t {}".format(metadata[0]))
            print("Uploader:\t {}".format(metadata[1]))
            print("Ext:\t\t {}".format(meta['ext']))
            print("ABR:\t\t {}".format(meta['abr']))
            print("Format:\t\t {}".format(meta['format']))

            downloadme = True
            if os.path.exists('music\\'+metadata[0]+'.mp3'):
                wut = input('This file alredy egzist. Download again? Write "y" or "yes" to download: ')
                if wut == 'y' or wut == 'yes':
                    downloadme = True
                else:
                    downloadme = False
           
            if downloadme:
                if not os.path.exists('music\\'):
                    os.makedirs('music')
                if os.path.exists('music\\ytd_tmp.mp3'):
                    os.remove('music\\ytd_tmp.mp3')
                if os.path.exists('music\\ytd_tmp'):
                    os.remove('music\\ytd_tmp')
            
                ytd.download([link])

                cmd = 'ffmpeg.exe -i music\\ytd_tmp -vn -ar 44100 -ac 2 -ab 192k -metadata artist="'+metadata[1]+'" -f mp3 music\\ytd_tmp.mp3'
                cmd = cmd + ' & del music\\ytd_tmp'
                os.system(cmd)
                while os.path.isdir('music\\ytd_tmp'):
                    time.sleep(0.1)
                
                if os.path.exists('music\\'+metadata[0]+'.mp3'):
                    os.remove('music\\'+metadata[0]+'.mp3')
                if os.path.exists('music\\ytd_tmp'):
                    os.remove('music\\ytd_tmp')
                rename = True
                while rename:
                    try:
                        os.rename('music\\ytd_tmp.mp3', 'music\\'+metadata[0]+'.mp3')
                        rename = False
                    except:
                        print("\nName change error!")
                        metadata[0] = input("Set new name: ")

                print('\nMusic convert compleate.')
                print('........................\n')
                input("Press button.\n")
    os.system('cls')