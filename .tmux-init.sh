#!/bin/bash

SESSION_NAME=Badge-Viewer

# Kill existing session if needed
tmux kill-session -t $SESSION_NAME

# Create new session
tmux new-session -s $SESSION_NAME -d

# Windows
tmux new-window -t $SESSION_NAME:1 # -n 'npm'
tmux new-window -t $SESSION_NAME:2 # -n 'vim'
tmux new-window -t $SESSION_NAME:3 # -n 'mongosh'
tmux kill-window -t $SESSION_NAME:0

# Panes
tmux split-window -v -p 50 -t $SESSION_NAME:1 # main editor
tmux split-window -v -p 50 -t $SESSION_NAME:3 # test runner


# Launch apps
tmux send-keys -t $SESSION_NAME:1.0 "cd ~/$SESSION_NAME/backend" C-m
tmux send-keys -t $SESSION_NAME:1.0 "npm start" C-m
tmux send-keys -t $SESSION_NAME:1.1 "cd ~/$SESSION_NAME/frontend" C-m
tmux send-keys -t $SESSION_NAME:1.1 "npm run dev" C-m
tmux send-keys -t $SESSION_NAME:2.0 "cd ~/$SESSION_NAME" C-m
tmux send-keys -t $SESSION_NAME:2.0 "vim" C-m
tmux send-keys -t $SESSION_NAME:3.1 "mongosh $SESSION_NAME" C-m

tmux attach -t $SESSION_NAME:2
