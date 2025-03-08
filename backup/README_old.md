# AI Agent Frameworks Landscape

This visualization plots various AI agent frameworks and intelligent workflow orchestration tools on a chart based on their code requirements (no-code to full-code) and implementation complexity.

## Setup Instructions

Due to browser security restrictions (CORS), you'll need to serve the files using a local web server instead of opening the HTML file directly in your browser.

Here are a few simple ways to serve the files:

### Option 1: Using Python

If you have Python installed, navigate to the project directory in your terminal and run:

```bash
# If you're using Python 3:
python -m http.server

# If you're using Python 2:
python -m SimpleHTTPServer
```

Then open your browser and go to: `http://localhost:8000/agent_visualization.html`

### Option 2: Using Node.js

If you have Node.js installed, you can use the `http-server` package:

```bash
# Install the package globally (do this once)
npm install -g http-server

# Run the server in the project directory
http-server
```

Then open your browser and go to: `http://localhost:8080/agent_visualization.html`

### Option 3: Using VS Code Live Server

If you're using Visual Studio Code, you can install the "Live Server" extension and then right-click on the HTML file and select "Open with Live Server".

## Data Management

The data for the visualization is stored in the `agent_frameworks.csv` file. To add or update frameworks, edit this CSV file directly.

The visualization uses the following fields for each framework:
- `name`: Name of the framework
- `category`: Either "Agent Framework" or "Orchestration"
- `code_level`: Value from 0 (no-code) to 1 (full-code)
- `code_level_justification`: Explanation for the code level rating
- `complexity`: Value from 0 (simple) to 1 (complex)
- `complexity_justification`: Explanation for the complexity rating
- `description`: Brief description of the framework
- `url`: Link to the framework's website

## Visualizing the Data

The visualization displays each framework as a logo positioned on the chart according to its code level (x-axis) and complexity (y-axis). You can:

1. Hover over a logo to see quick details
2. Click on a logo to open a detailed modal with justifications
3. Use the checkboxes to filter by category (Agent Frameworks or Orchestration Tools)