$('.accordian-body').change('show.bs.collapse', function () {
    $(this).closest("table")
        .find(".collapse.in")
        .not(this)
        .collapse('toggle')
});


function searchDirPath()
{

    let input, filter, table, dirName;
    input = document.getElementById("search");
    filter = input.value.toUpperCase();
    table = document.getElementsByTagName("table");

    for(let i = 0; i < table.length; i++)
    {

        dirName = table[i].getElementsByTagName("th")[0].textContent.toUpperCase();

        if(dirName.indexOf(filter) > -1)
        {

            table[i].style.display = "";

        } else {

            table[i].style.display = "none";

        }

    }


}

function showHideMissingFiles()
{

    let buttonCaption = document.getElementById("showHideMissingFiles");
    let missingFilesDir = document.getElementById("missingDirFile");
    let distinctFiles = document.getElementById("distinctFiles");
    let searchBox = document.getElementById("searchBox");


    if(missingFilesDir.style.display !== "")
    {
        missingFilesDir.style.display = "";
        distinctFiles.style.display = "none";
        buttonCaption.innerHTML = "Show Diff Files";
        buttonCaption.className = "btn btn-success";
        searchBox.style.display = "none"
    } else {
        distinctFiles.style.display = "";
        missingFilesDir.style.display = "none";
        buttonCaption.innerHTML = "Show Missing Files / Directories";
        buttonCaption.className = "btn btn-warning";
        searchBox.style.display = ""
    }


}


