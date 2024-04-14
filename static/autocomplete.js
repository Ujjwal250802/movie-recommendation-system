new autoComplete({
    data: {                            
      src: moviesData,
    },
    selector: "#autoCompleteInput",         
    threshold: 2,                      
    debounce: 100,                     
    searchEngine: "strict",            
    resultsList: {                     
        render: true,
        container: source => {
            source.setAttribute("id", "movie_list");
        },
        destination: document.querySelector("#autoCompleteInput"),
        position: "afterend",
        element: "ul"
    },
    maxResults: 5,                         
    highlight: true,                       
    resultItem: {                          
        content: (data, source) => {
            source.innerHTML = data.match;
        },
        element: "li"
    },
    noResults: () => {                     
        const result = document.createElement("li");
        result.setAttribute("class", "no_result");
        result.setAttribute("tabindex", "1");
        result.innerHTML = "No Results";
        document.querySelector("#autoComplete_list").appendChild(result);
    },
    onSelection: feedback => {             
        document.getElementById('autoCompleteInput').value = feedback.selection.value;
    }
});
