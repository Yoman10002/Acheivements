This is how i made connection from dgx spark(run the ai model) to my laptop via anything llm.

# HOW ANYTHING LLM IS USED TO ESTABLISH A CONNECTION BETWEEN THE 2 MACHINES

## REQUIREMENTS
* 2 Machines
* internet connection
* ollama (not completely nescesarry, as long as similar steps for other ai managers are used)


## Machine 1 (dgx spark) 

* **Setup ollama :** Refer to the [Official Installation](https://ollama.com/download) for each operating system.
  For me, i am on **dgx os** (a special flavor of **ubuntu** designed for the dgx spark).
  ```console
  curl -fsSL https://ollama.com/install.sh | sh
  ```

* **Start ollama:** open a new console and type..
  ```console
  ollama serve
  ```
  to start ollama.

* **Download Models:** Open a new terminal and type.. 
  ```console
  ollama pull qwen2.5-coder:7b
  ```
  to install qwen 2.5-coder 7b, and for other models refer to [Official Library](https://ollama.com/library).

* **Run Models(for self use. not required for connection):** command to run the model... also available at the [Official Library](https://ollama.com/library).
  ```console
  ollama run qwen2.5-coder:7b
  ```

## Machine 2 (personal computer)
