setTimeout(()=>{


while (document.body.firstElementChild) {
    console.log(document.body.firstElementChild);
    document.body.removeChild(document.body.firstElementChild);
}


var mainInput = document.createElement("textarea");

mainInput.id = "mainInput";
mainInput.style.width = "90px";
mainInput.style.height = "90px";
document.body.appendChild(mainInput);

document.body.addEventListener("keydown", (event) => {
    if (event.key === "F12") {
        return;
    }
    event.preventDefault();

    if (event.key === "R") {
        fetch("/cmd_build", { method: "GET" });
    }

    console.log("unhandled key event.");
});




}, 1000);



