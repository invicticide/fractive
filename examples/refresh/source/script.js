Core.AddEventListener("OnGotoSection", function(id, element, tags, reason)
{
    console.log(`Navigated to section ${id} for reason ${reason}`);
});

window.GetRandom = function()
{
    return Math.floor(Math.random() * 100);
}

window.Refresh = function()
{
    Core.RefreshCurrentSection();
}
