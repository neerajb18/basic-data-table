/** Choosen columns from API */
const COLUMNS = ["name", "capital", "area", "population", "region"];

/** Configurable option */
let OPTIONS = {
    sortable: [COLUMNS[0], COLUMNS[3]],
    filterable: [COLUMNS[1], COLUMNS[2]],
    isHeaderFixed: true,
    isPaginated: true,
}


!(function (_options) {

    let _tableData = [];
    let _formattedData = [];
    let filterObj = {};
    let sortObj = {};

    let limit = 5;
    let currentPageIndex = 0;
    let totalPages = 0;

    initializeFilter();
    initializeSort();
    renderHeader();
    fetchData();

    /**
     * Initialize filter state
     */
    function initializeFilter() {
        if (_options.filterable && Array.isArray(_options.filterable)) {
            for (let i in _options.filterable) {
                filterObj[_options.filterable[i]] = null;
            }
        }
    }

    /**
     * Initialize sort state
     */
    function initializeSort() {
        if (_options.sortable) {
            sortObj = {
                column: _options.sortable[0],
                order: 'asc'
            }
        }
    }

    /**
     * Fetch data from countries API
     */
    function fetchData() {
        fetch('https://restcountries.eu/rest/v2/all').then(function (response) {
            return response.json();
        }).then(function (data) {
            _tableData = data.map(function (item) {
                let obj = {};
                for (let i in COLUMNS) {
                    obj[COLUMNS[i]] = item[COLUMNS[i]];
                }
                return obj;
            });

            setFormattedData(_tableData);
            setTotalPages(_tableData);
            renderTable();

            if (_options.isPaginated) {
                showPaginationLimit();
                renderPagination();
            }

        }).catch(function (err) {
            // There was an error
            console.warn('Something went wrong.', err);
        });
    }

    /**
     * Set formatted data
     */
    function setFormattedData(data) {
        _formattedData = data;
    }

    /**
     * Get formatted data: used to render table body
     */
    function getFormattedData() {
        return JSON.parse(JSON.stringify(_formattedData));
    }

    /**
     * Filter data
     */
    function filterData() {
        let data = JSON.parse(JSON.stringify(_tableData));
        data = data.filter(function (row) {
            let flag = true;
            
            for (let column in filterObj) {
                
                if (filterObj[column] && !row[column]) {
                    return false;
                } else if (filterObj[column] &&
                    !row[column].toString().toLowerCase().includes(filterObj[column].toLowerCase())) {
                    flag = false;
                }

            }
            
            return flag;
        });

        if (_options.isPaginated) {
            currentPageIndex = 0;
            setTotalPages(data);
        }

        setFormattedData(data);
        sortData();
    }

    /**
     * Sort formatted data
     */
    function sortData() {
        let data = getFormattedData();
        data.sort(function (a, b) {
            return sortObj.order === 'desc' ?
                ('' + b[sortObj.column]).localeCompare(a[sortObj.column]) :
                ('' + a[sortObj.column]).localeCompare(b[sortObj.column]);
        });
        setFormattedData(data);
    }

    /**
     * Set total page count
     */
    function setTotalPages(data) {
        totalPages = Math.ceil(data.length / limit);
    }

    /**
     * Update total page count
     */
    function updateTotalPages() {
        let data = getFormattedData();
        setTotalPages(data);
    }

    /**
     * Set page action
     */
    function setPage(index) {
        currentPageIndex = index;
        renderTable();
        renderPagination();
    }

    /**
     * Next page action
     */
    function nextPage() {
        if (currentPageIndex < totalPages - 1) {
            currentPageIndex++;
            renderTable();
            renderPagination();
        }
    }

    /**
     * Previous page action
     */
    function previousPage() {
        if (currentPageIndex > 0) {
            currentPageIndex--;
            renderTable();
            renderPagination();
        }
    }

    /**
     * Sort action
     * @param {string} column 
     */
    function sort(column) {
        if (column === sortObj["column"]) {
            sortObj["order"] = sortObj["order"] === 'asc' ? 'desc' : 'asc';
        } else {
            sortObj["order"] = 'asc';
            sortObj["column"] = column;
        }

        sortData();
        renderTable();
    }

    /**
     * Filter action
     * @param {string} column 
     * @param {string} value 
     */
    function filter(column, value) {
        filterObj[column] = value;

        filterData();
        renderTable();

        if (_options.isPaginated) {
            currentPageIndex = 0;
            renderPagination();
        }
    }

    /**
     * Render Header
     */
    function renderHeader() {
        let thead = document.getElementsByTagName('thead');
        let trHeader = document.createElement('tr');
        let trFilter = document.createElement('tr');

        if (_options.isHeaderFixed) {
            trHeader.className = 'sticky';
        }

        COLUMNS.forEach(function (column) {
            let thHeader = document.createElement('th');
            let thFilter = document.createElement('th');

            if (_options.sortable && _options.sortable.includes(column)) {
                thHeader.className = 'sortable';
                thHeader.addEventListener("click", function (event) {
                    sort(column);
                    applyStyle(this);

                });
            }
            thHeader.textContent = column.charAt(0).toUpperCase() + column.substr(1);
            trHeader.appendChild(thHeader);

            if (_options.filterable) {
                if (_options.filterable.includes(column)) {
                    thFilter.appendChild(getInput(column));
                }
                trFilter.appendChild(thFilter);
            }
        });

        thead[0].appendChild(trHeader);

        if (trFilter.hasChildNodes) {
            thead[0].appendChild(trFilter);
        }
    }

    /**
     * Apply style: add/remove sort arrows
     * @param {HTMLElement} e 
     */
    function applyStyle(e) {
        let sibling = e.parentNode.firstChild;

        while (sibling) {
            if (sibling.nodeType === 1 && sibling !== e) {
                sibling.classList.remove("sort_asc");
                sibling.classList.remove("sort_desc");
            }
            sibling = sibling.nextSibling;
        }

        e.className = sortObj.order === 'asc' ? "sortable sort_asc" : "sortable sort_desc";
    }

    /**
     * Render table body content
     */
    function renderTable() {
        let data = getFormattedData();
        let totalEntries = data.length;

        if (_options.isPaginated) {
            let start = currentPageIndex * limit;
            let end = Math.min(currentPageIndex * limit + limit, totalEntries);

            data = data.slice(start, end);

            document.getElementById('entries').innerHTML =
                `Showing ${Math.min(start + 1, totalEntries)} to ${end} of ${totalEntries}`;
        }

        data = data.map(function (row) {
            return `<tr>
            ${COLUMNS.map(function (column) {
                return `<td>${row[column]}</td>`;
            }).join('')}
            </tr>`
        }).join('');

        document.getElementsByTagName('tbody')[0].innerHTML = data;

    }


    /**
     * Show pagination limit
     */
    function showPaginationLimit() {
        let limitNode = document.getElementById('pagination-limit');
        limitNode.style.display = 'block'

        limitNode.addEventListener('change', function (event) {
            limit = parseInt(event.target.value);
            currentPageIndex = 0;

            updateTotalPages();
            renderTable();
            renderPagination();
        });


    }

    /**
     * Render pagination
     */
    function renderPagination() {
        let pagination = document.getElementById('pagination');
        let startIndex, endIndex;

        pagination.innerHTML = '';

        if (totalPages > 1) {
            pagination.appendChild(getAnchorTag('&laquo', 'prev'));

            if (totalPages < 5) {
                startIndex = 0;
                endIndex = totalPages;
            } else if (totalPages - currentPageIndex < 5) {
                startIndex = Math.abs(totalPages - 5);
                endIndex = totalPages;
            } else {
                startIndex = currentPageIndex;
                endIndex = startIndex + 5;
            }

            for (let i = startIndex; i < endIndex; i++) {
                let a = getAnchorTag(i + 1);

                if (currentPageIndex === i) {
                    a.className = 'selected';
                }

                pagination.appendChild(a);
            }

            pagination.appendChild(getAnchorTag('&raquo', 'next'));
        }
    }


    /**
     * Get anchor tag for pagination: prev, next, number
     * @param {string | number} content 
     * @param {string} action 
     */
    function getAnchorTag(content, action) {
        let a = document.createElement('a');
        a.innerHTML = content;
        if (action === 'prev') {
            a.addEventListener('click', function () {
                previousPage();
            });
        } else if (action === 'next') {
            a.addEventListener('click', function () {
                nextPage();
            });
        } else {
            a.addEventListener('click', function () {
                setPage(content - 1);
            });
        }
        return a;
    }


    function getInput(column) {
        let input = document.createElement("input");
        input.type = "text";
        input.placeholder = `Search ${column}`
        input.addEventListener('keyup', function (event) {
            filter(column, event.target.value);
        });
        return input;
    }

})(OPTIONS);