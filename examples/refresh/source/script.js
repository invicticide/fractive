Core.AddEventListener("OnGotoSection", function(id, element, tags, reason)
{
    console.log(`Navigated to section ${id} for reason ${reason}`);
});

function GetRandom()
{
    return Math.floor(Math.random() * 100);
}

function Refresh()
{
    Core.RefreshCurrentSection();
}
