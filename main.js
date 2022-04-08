var $ = element => document.getElementById(element),
    game = {};

// function to limit the number of decimals in a number
function maxDecimals(number, max) {
    var num = number.toFixed(max);
    var decimal = num.split(".")[1] || "";
    if (decimal != "") {
        if (decimal[0] == "0") {
            if (decimal[1] == "0") {
                return parseInt(num);
            } else {
                return num;
            }
        } else if (decimal[1] == "0") {
            return parseFloat(num).toFixed(1)
        } else {
            return num;
        }
    } else {
        return num;
    }
}

// define all upgrades
game.upgrades = JSON.parse(localStorage.getItem("upgrades")) || [
    {
        type: "magnet",
        name: "Flexible",
        sellingPrice: 2.50
    },
    {
        type: "magnet",
        name: "Ferrite",
        sellingPrice: 5.00
    },
    {
        type: "magnet",
        name: "Alnico",
        sellingPrice: 23.00
    },
    {
        type: "magnet",
        name: "Samarium",
        sellingPrice: 35.00
    },
    {
        type: "magnet",
        name: "Neodymium",
        sellingPrice: 65.00
    },
    {
        type: "sales",
        name: "Auto Seller",
        maxed: false,
        get upgradeCost() { return ((1 - (game.player.autoSeller.time - 0.15)) * 10) * 120; }
    },
    {
        type: "sales",
        name: "Advertisement",
        get upgradeCost() { return ((game.player.advertisements ** 1.1) * 800); }
    },
    {
        type: "production",
        name: "Factory",
        get upgradeCost() { return (((game.player.factories + 2) ** 3) + 80) * 4; }
    },
    {
        type: "production",
        name: "Worker",
        get upgradeCost() { return (game.player.workers + 2) ** 2.3 + 60; }
    },
].map(upgrade => {
    if (upgrade.type == "magnet") {
        upgrade.upgradeCost = (upgrade.sellingPrice ** (2/3)) * 1000;
        upgrade.unlocked = false;
        upgrade.requirements = {
            factories: (upgrade.sellingPrice ** 0.75).toFixed(0),
            workers: (upgrade.sellingPrice ** 0.75 * 2.7).toFixed(0)
        };
    } return upgrade;
});

game.render = function() {
    // update stats
    $("magnets").innerHTML = `Magnets: ${game.player.magnets}`;
    $("magnetType").innerHTML = `${game.player.magnetType.name} ($${game.player.magnetType.sellingPrice.toFixed(2)})`;
    $("money").innerHTML = `Money: $${game.player.money.toFixed(2)}`;
    $("factories").innerHTML = `Factories: ${game.player.factories}`;
    $("workers").innerHTML = `Workers: ${game.player.workers}`;
    $("advertisements").innerHTML = `Advertisements: ${game.player.autoSeller.activated ? game.player.advertisements : "0"}`;
    $("autoSellerSpeed").innerHTML = `Auto Seller Speed: ${game.player.autoSeller.activated ? maxDecimals(game.player.autoSeller.speed, 2) + "mps" : "N/A"}`;
    $("autoSeller").innerHTML = `Auto Seller: ${game.player.autoSeller.available ? (game.player.autoSeller.activated ? "ON" : "OFF") : "UNAVAILABLE"}`;

    // manage top button diabled state
    if (this.player.magnets < 1) {
        $("sellMagnet").disabled = true;
    } else {
        $("sellMagnet").disabled = false;   
    } if (!this.player.autoSeller.available) {
        $("autoSeller").disabled = true;
    } else {
        $("autoSeller").disabled = false;
    }

    for (upgrade of game.upgrades.slice(1)) {
        // add text to buttons
        var button = $(`upgrade-${upgrade.name}`);
        button.innerHTML = `<b>${upgrade.name}${upgrade.type == "magnet" ? " Magnet" : ""}</b><br><br>Upgrade Cost: $${upgrade.upgradeCost.toFixed(2)}<br>`;
        if (upgrade.type == "magnet") {
            button.innerHTML += `Selling Price: $${upgrade.sellingPrice.toFixed(2)}<br>Requirements:<br>    - ${upgrade.requirements.factories} Factories<br>    - ${upgrade.requirements.workers} Workers`;
        } else if (upgrade.name == "Advertisement") {
            button.innerHTML += `Auto Seller Speed +${maxDecimals(Math.abs(((game.player.advertisements + 1) / game.player.autoSeller.time) - game.player.autoSeller.speed), 2)}mps`;
        } else if (upgrade.name == "Auto Seller") {
            button.innerHTML += `Auto Seller Speed +${maxDecimals(Math.abs((game.player.advertisements / ((game.player.autoSeller.time) - (game.player.autoSeller.time <= 0.15 ? 0.1 : 0.15))) - game.player.autoSeller.speed), 2)}mps`;
        }

        // toggle hidden and disabled states
        var unlocked = upgrade.unlocked || false;
        button.hidden = true;
        button.disabled = true;
        if (!unlocked) {
            if (game.player.money >= upgrade.upgradeCost) {
                button.hidden = false;
                button.disabled = false;
                if (upgrade.type == "magnet") {
                    if (game.player.factories < upgrade.requirements.factories || game.player.workers < upgrade.requirements.workers) {
                        button.disabled = true;
                    }
                } else if (upgrade.name == "Advertisement") {
                    if (!game.player.autoSeller.available) {
                        button.hidden = true;
                    }
                }
            } else if (game.player.money >= upgrade.upgradeCost * 0.6) {
                button.hidden = false;
            }
        } if (upgrade.name == "Auto Seller") {
            if (upgrade.maxed == true) {
                button.disabled = true;
                button.innerHTML = "<b>Auto Seller</b><br><br>Your auto seller is maxed out!";
            }
        }
    }

    // check if the player has beaten the game
    if (game.player.money > 267300000000) {
        setTimeout(() => {
            clearInterval(renderLoop)
            localStorage.removeItem("game");
            alert(`Congratulations, your magnet company has earned you $${game.player.money} making you the richest person in the world!`);
            location.reload();
        }, 500);
    }

    localStorage.setItem("game", JSON.stringify(game.player));
    localStorage.setItem("upgrades", JSON.stringify(game.upgrades));
}

// restore game from local storage if possible
if (localStorage.getItem("game")) {
    game.player = JSON.parse(localStorage.getItem("game"));
} else {
    game.player = {
        magnets: 0,
        magnetType: game.upgrades[0],
        money: 0,
        factories: 0,
        workers: 0,
        advertisements: 1,
        autoSeller: {
            available: false,
            activated: false,
            time: 1,
            get speed() {
                return game.player.advertisements / game.player.autoSeller.time;
            }
        }
    }
}

// insert upgrade buttons
game.upgrades.slice(1).forEach((upgrade, index) => {
    var button = document.createElement("button");
    button.id = `upgrade-${upgrade.name}`;

    // add text to buttons
    button.innerHTML = `<b>${upgrade.name}${upgrade.type == "magnet" ? " Magnet" : ""}</b><br><br>Upgrade Cost: $${upgrade.upgradeCost.toFixed(2)}<br>`;
    if (upgrade.type == "magnet") {
        button.innerHTML += `Selling Price: $${upgrade.sellingPrice.toFixed(2)}<br>Requirements:<br>    - ${upgrade.requirements.factories} Factories<br>    - ${upgrade.requirements.workers} Workers`;
    } else if (upgrade.name == "Advertisement") {
        button.innerHTML += `Auto Seller Speed +${maxDecimals(Math.abs(((game.player.advertisements + 1) / game.player.autoSeller.time) - game.player.autoSeller.speed), 2)}mps`;
    } else if (upgrade.name == "Auto Seller") {
        button.innerHTML += `Auto Seller Speed +${!game.player.autoSeller.available ? 1.18 : (maxDecimals(Math.abs((game.player.advertisements / ((game.player.autoSeller.time) - (game.player.autoSeller.time <= 0.15 ? 0.1 : 0.15))) - game.player.autoSeller.speed), 2))}mps`;
    }

    // add onclick function to each button (implement upgrades)
    if (upgrade.type == "magnet") {
        button.onclick = event => {
            upgrade.unlocked = true;
            game.player.money -= upgrade.upgradeCost;
            game.player.magnetType = game.upgrades[index + 1];
        }
    } else if (upgrade.name == "Advertisement") {
        button.onclick = event => {
            game.player.money -= upgrade.upgradeCost;
            game.player.advertisements++;
            setSalesLoop();
        }
    } else if (upgrade.name == "Auto Seller") {
        button.onclick = event => {
            game.player.autoSeller.activated = true;
            game.player.autoSeller.available = true;
            game.player.money -= upgrade.upgradeCost;
            if (!game.upgrades[5].maxed) {
                game.player.autoSeller.time -= 0.15;
            } if (game.player.autoSeller.time <= 0.1) {
                game.upgrades[5].maxed = true;
            } setSalesLoop();;
        }
    } else if (upgrade.name == "Factory") {
        button.onclick = () => {
            game.player.money -= upgrade.upgradeCost;
            game.player.factories++;
        }
    } else if (upgrade.name == "Worker") {
        button.onclick = () => {
            game.player.money -= upgrade.upgradeCost;
            game.player.workers++;
        }
    }

    $("upgrades").appendChild(button);
});

// handle top button clicks
document.addEventListener("click", event => {
    if (event.target.id == "makeMagnet") {
        game.player.magnets++;
    } else if (event.target.id == "sellMagnet") {
        game.player.money += game.player.magnetType.sellingPrice;
        game.player.magnets--;
    } else if (event.target.id == "autoSeller") {
        if (game.player.autoSeller.available) {
            game.player.autoSeller.activated = !game.player.autoSeller.activated;
        }
    } else if (event.target.id == "info") {
        alert("Beat the game by being richer than Elon Musk who, at the time of making this is the richest person in the world with **$267.3 billion USD**. If you'd like to restart the game earlier, press **Cmd/Ctrl + Shift + R**.\n\n------------------------------\n\nAuthor: Toby Connor-Kebbell\nDate: March 2022\nVersion: 0.2\nCode: [GitHub](https://github.com/tobyck/magco)");
    }
});

// set up the game at the beginning
function setProductionLoop() {
    setInterval(() => {
        if (game.player.factories > 0 || game.player.workers > 0) {
            var toAdd = Math.ceil(((game.player.factories * 5) * (game.player.workers * 0.4))) + 1;
            if (toAdd > 0) {
                game.player.magnets += toAdd;
            } else {
                game.player.magnets++;
            }
        }
    }, 1000);
}

function setSalesLoop() {
    if (salesLoop) {
        clearInterval(salesLoop);
    }
    var salesLoop = setInterval(() => {
        if (game.player.autoSeller.activated) {
            if (game.player.magnets > 0) {
                game.player.magnets--;
                game.player.money += game.player.magnetType.sellingPrice;
            }
        }
    }, game.player.autoSeller.time * 1000);
}

setProductionLoop();
setSalesLoop();
var renderLoop = setInterval(() => game.render(), 83);

// prevent tab from selecting buttons
document.addEventListener("keydown", event => {
    if (event.key == "Tab") {
        event.preventDefault();
    } else if (event.metaKey && event.shiftKey && event.keyCode == 82) {
        clearInterval(renderLoop)
        localStorage.removeItem("game");
        location.reload();
        event.preventDefault();
    }
});

// block context menu so that fast clicking isn't accidentally disruppted
document.addEventListener("contextmenu", event => {
    event.preventDefault();
});