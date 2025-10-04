graph TB
    Start([👤 User Starts Claude Code]) --> Ask[Claude: What is your project name?]
    
    Ask --> UserAnswer[User: 'E-Commerce App']
    
    UserAnswer --> Tool1[🔧 Claude → Python<br/>TOOL: host_tool<br/>project_name: 'E-Commerce App']
    
    subgraph Python1[" 🐍 PYTHON SERVER - Port 8080 "]
        Tool1 --> P1[Create Folder:<br/>./projects/E-Commerce App/]
        P1 --> P2[Create 3 Files:<br/>📄 main.js empty<br/>📄 frontend_data.js empty<br/>📄 ddd.js empty]
        P2 --> P3[Start React Frontend<br/>on Port 3000]
        P3 --> P4[Send Success to Claude]
        P4 --> P5[Broadcast to React:<br/>project_initialized]
    end
    
    P5 --> Interview[Claude Starts Interview<br/>Asks Questions]
    
    Interview --> Q1[Claude: What features?<br/>User: Login, Cart, Checkout]
    
    Q1 --> Tool2[🔧 Claude → Python<br/>TOOL: update_json<br/>question + answer]
    
    subgraph Python2[" 🐍 PYTHON SERVER "]
        Tool2 --> P6[Read current files:<br/>main.js, ddd.js]
        P6 --> P7[Parse user answer:<br/>Extract features & entities]
        P7 --> P8[Update main.js:<br/>Add requirements]
        P7 --> P9[Update ddd.js:<br/>Add domain entities]
        P8 --> P10[Send to React:<br/>files_updated]
        P9 --> P10
    end
    
    P10 --> React1[React Shows:<br/>Requirements View]
    
    React1 --> More{More Questions?}
    
    More -->|Yes| Interview
    More -->|No, User Confirms All Done| Tool3[🔧 Claude → Python<br/>TOOL: show_figma]
    
    subgraph Python3[" 🐍 PYTHON SERVER "]
        Tool3 --> P11[Read main.js:<br/>Get all requirements]
        P11 --> P12[Generate Figma JSON:<br/>• Create pages<br/>• Create components<br/>• Calculate positions<br/>• Set styles & colors]
        P12 --> P13[Write frontend_data.js:<br/>Complete design]
        P13 --> P14[Send to React:<br/>switch_to_figma_mode]
    end
    
    P14 --> React2[React Switches to:<br/>Design Canvas Mode]
    
    React2 --> Canvas[Interactive Canvas<br/>with all components]
    
    Canvas --> UserEdit{User Edits?}
    
    UserEdit -->|Drag/Resize/Color| Edit1[React: Update instantly<br/>Optimistic UI]
    
    Edit1 --> Edit2[Wait 300ms<br/>Debounce]
    
    Edit2 --> Edit3[React → Python:<br/>canvas_edit<br/>component_id + updates]
    
    subgraph Python4[" 🐍 PYTHON SERVER "]
        Edit3 --> P15[Update frontend_data.js<br/>ONLY this file]
        P15 --> P16[Send confirmation<br/>to React]
    end
    
    P16 --> Edit4[React Shows:<br/>Saved ✅]
    
    UserEdit -->|Add Complex Component| Add1[React Shows Modal:<br/>Ask Claude to add]
    
    Add1 --> Add2[User → Claude:<br/>Add login form]
    
    Add2 --> Tool4[🔧 Claude → Python<br/>TOOL: update_json<br/>new component details]
    
    subgraph Python5[" 🐍 PYTHON SERVER "]
        Tool4 --> P17[Update ALL 3 Files:<br/>• main.js - requirement<br/>• ddd.js - domain logic<br/>• frontend_data.js - design]
        P17 --> P18[Send to React:<br/>files_updated]
    end
    
    P18 --> Add3[React: Reload canvas<br/>New component appears]
    
    Edit4 --> Final
    Add3 --> Final
    
    Final[🎉 FINAL OUTPUT:<br/>3 Rich Context Files]
    
    Final --> Out1[📄 main.js<br/>Complete Requirements<br/>User Flows & Features]
    
    Final --> Out2[📄 frontend_data.js<br/>Complete Figma Design<br/>All Components & Styles]
    
    Final --> Out3[📄 ddd.js<br/>Domain Driven Design<br/>Entities & Services]
    
    Out1 --> End([✅ READY FOR DEVELOPMENT])
    Out2 --> End
    Out3 --> End
    
    subgraph React[" ⚛️ REACT FRONTEND - Port 3000 "]
        React1
        React2
        Canvas
        Edit1
    end
    
    subgraph Claude[" 🤖 CLAUDE CODE "]
        Start
        Ask
        Interview
        Tool1
        Tool2
        Tool3
        Tool4
    end
    
    style Start fill:#4fc3f7,stroke:#01579b,stroke-width:3px,color:#000
    style End fill:#66bb6a,stroke:#1b5e20,stroke-width:3px,color:#000
    style Python1 fill:#d1c4e9,stroke:#4527a0,stroke-width:3px
    style Python2 fill:#d1c4e9,stroke:#4527a0,stroke-width:3px
    style Python3 fill:#d1c4e9,stroke:#4527a0,stroke-width:3px
    style Python4 fill:#d1c4e9,stroke:#4527a0,stroke-width:3px
    style Python5 fill:#d1c4e9,stroke:#4527a0,stroke-width:3px
    style React fill:#b2ebf2,stroke:#006064,stroke-width:3px
    style Claude fill:#fff9c4,stroke:#f57f17,stroke-width:3px
    style Final fill:#a5d6a7,stroke:#1b5e20,stroke-width:3px,color:#000
    style Out1 fill:#f48fb1,stroke:#880e4f,stroke-width:2px,color:#000
    style Out2 fill:#f48fb1,stroke:#880e4f,stroke-width:2px,color:#000
    style Out3 fill:#f48fb1,stroke:#880e4f,stroke-width:2px,color:#000
    style Tool1 fill:#ffd54f,stroke:#f57f17,stroke-width:2px,color:#000
    style Tool2 fill:#ffd54f,stroke:#f57f17,stroke-width:2px,color:#000
    style Tool3 fill:#ffd54f,stroke:#f57f17,stroke-width:2px,color:#000
    style Tool4 fill:#ffd54f,stroke:#f57f17,stroke-width:2px,color:#000      