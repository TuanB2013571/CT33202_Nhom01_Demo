let vertices = []; // đỉnh
let edges = []; // cạnh
let hValues = {};

// Tạo network cho đồ thị
let nodes = new vis.DataSet(); // tạo dataset lưu trữ thông tin các đỉnh
let edgesList = new vis.DataSet(); // lưu trữ thông tin các cạnh
let container = document.getElementById('graph'); // lấy id graph để hiển thị đồ thị

// tạo đối tượng chứa thông tin các đỉnh và cạnh
let data = { 
    nodes: nodes,
    edges: edgesList
};

let options = {
    // nodes: {
    //     color: {
    //         background: 'red',
    //         border: 'red',
    //         highlight: {
    //             background: 'darkred',
    //             border: 'darkred'
    //         }
    //     }
    // },
    edges: {
        arrows: 'to', //thiết lập mũi tên
        // color: {
        //     color: 'red',
        //     highlight: 'darkred'
        // }
    }
};

let network = new vis.Network(container, data, options); //tạo đối tượng netwwork

// Xử lý tải file input.txt
document.getElementById('loadGraphBtn').addEventListener('click', function () {
    let fileInput = document.getElementById('fileInput').files[0];
    if (fileInput) {
        let reader = new FileReader();
        reader.onload = function (e) {
            let content = e.target.result;
            parseInputFile(content);
            drawGraph();
        };
        reader.readAsText(fileInput);
    }
});

// Hàm xử lý file input.txt
function parseInputFile(content) {
    let lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0); 
    // đọc từng dòng dữ liệu bỏ khoảng trống đầu cuối bỏ hàng không có nội dung

    // Đọc các đỉnh và giá trị h (dòng đầu tiên)
    let vertexData = lines[0].split(' '); // đọc dòng đầu tiên
    vertices = []; // đỉnh
    hValues = {};
    for (let i = 0; i < vertexData.length; i += 2) { // lấy 2 giá trị
        let vertex = vertexData[i]; // i là tên đỉnh
        let h = parseFloat(vertexData[i + 1]); // i +1 là giá trị h
        vertices.push(vertex); // thêm vào mảng
        hValues[vertex] = h; // lưu h vào với đỉnh là key
    }

    // Đọc các cạnh
    edges = [];
    let edgeSet = new Set(); // Tập hợp để kiểm tra cạnh đã được thêm vào danh sách hiển thị
    for (let i = 1; i < lines.length; i++) { // đọc từ hàng 2
        let parts = lines[i].split(' '); // chia dòng dựa theo khoảng trắng
        if (parts.length === 3) { // xử lý nếu đủ 3 phần
            let [from, to, weight] = parts; // gán parts vào các biến theo định dạng
            weight = parseFloat(weight); // chuyển sang float

            // Tạo một key dạng "A-B" hoặc "B-A" để đảm bảo chỉ hiển thị một cạnh
            let edgeKey = `${from}-${to}`;
            let reverseEdgeKey = `${to}-${from}`;

            // Thêm cả cạnh xuôi và ngược vào mảng edges để đảm bảo duyệt được cả hai chiều
            edges.push({ from: from, to: to, weight: weight });
            edges.push({ from: to, to: from, weight: weight });

            // Chỉ thêm một cạnh (xuôi) vào danh sách hiển thị
            if (!edgeSet.has(edgeKey) && !edgeSet.has(reverseEdgeKey)) { 
                // kiểm tra xem edgeKey (khoá cạnh xuôi) và reverseEdgeKey (khoá cạnh ngược) có tồng tại trong edgeset không
                edgeSet.add(edgeKey); // nếu chưa thêm thì thêm edgeKey vào adgeSet
            }
        }
    }
}

// Hàm vẽ đồ thị
function drawGraph() {
    // Thêm các đỉnh vào đồ thị
    nodes.clear();
    edgesList.clear();
    vertices.forEach(vertex => {
        nodes.add({ id: vertex, label: vertex });  // Chỉ hiển thị tên đỉnh
    });

    // Thêm các cạnh vào đồ thị (chỉ hiển thị một cạnh giữa hai đỉnh)
    let displayedEdges = new Set();
    edges.forEach(edge => {
        let edgeKey = `${edge.from}-${edge.to}`;
        let reverseEdgeKey = `${edge.to}-${edge.from}`;

        // Chỉ hiển thị một cạnh nếu cạnh ngược chưa được hiển thị
        if (!displayedEdges.has(edgeKey) && !displayedEdges.has(reverseEdgeKey)) {
            edgesList.add({
                from: edge.from,
                to: edge.to,
                label: edge.weight.toString(),
                arrows: 'none' // Không có mũi tên
            });
            displayedEdges.add(edgeKey);
        }
    });

    // Hiển thị giá trị h của các đỉnh
    let heuristicList = document.getElementById('heuristicList');
    heuristicList.innerHTML = '';  // Xóa danh sách hiện tại
    for (let vertex in hValues) {
        let listItem = document.createElement('li');
        listItem.textContent = `${vertex}: h = ${hValues[vertex]}`;
        heuristicList.appendChild(listItem);
    }
}


// Xử lý nút nhấn tìm đường đi
document.getElementById('calculatePathBtn').addEventListener('click', function () {
    let start = document.getElementById('startVertex').value.trim();
    let end = document.getElementById('endVertex').value.trim();
    let algorithm = document.getElementById('algorithmSelect').value;
    if (algorithm === 'aStar') {
        var div = document.getElementById("table_result");
        div.style.visibility = "visible";
        
        let path = aStarAlgorithm(start, end); // Gọi hàm từ gtAsao.js
        let pathResult = document.getElementById('pathResult');
        let totalCost = document.getElementById('totalCost');
        let traversalOrderElement = document.getElementById('traversalOrder');

        if (path.length > 0) {
            let pathString = path.join(' -> ');
            let cost = path.slice(1).reduce((sum, node, index) => sum + getEdgeWeight(path[index], node), 0) + (hValues[end] || 0);

            // Hiển thị đường đi
            pathResult.textContent = `Đường đi: ${pathString}`;

            // Hiển thị tổng chi phí
            totalCost.textContent = `Tổng chi phí: ${cost}`;

            // Hiển thị thứ tự duyệt
            let orderString = getTraversalOrder(); // Lấy thứ tự duyệt từ gtAsao.js
            traversalOrderElement.textContent = `Thứ tự duyệt: ${orderString.join(' -> ')}`;
        } else {
            pathResult.textContent = `Không tìm thấy đường đi.`;
            totalCost.textContent = ``;
            traversalOrderElement.textContent = ``;
        }
    } else if (algorithm === 'ucs') {
        var div = document.getElementById("table_result");
        div.style.visibility = "visible";

        let path = ucsAlgorithm(start, end); // Gọi hàm từ ucs.js
        let pathResult = document.getElementById('pathResult');
        let totalCost = document.getElementById('totalCost');
        let traversalOrderElement = document.getElementById('traversalOrder');

        if (path.length > 0) {
            let pathString = path.join(' -> ');
            let cost = path.slice(1).reduce((sum, node, index) => sum + getEdgeWeight(path[index], node), 0);

            // Hiển thị đường đi
            pathResult.textContent = `Đường đi: ${pathString}`;

            // Hiển thị tổng chi phí
            totalCost.textContent = `Tổng chi phí: ${cost}`;

            // Hiển thị thứ tự duyệt
            let orderString = getTraversalOrderUCS(); // Lấy thứ tự duyệt từ ucs.js
            traversalOrderElement.textContent = `Thứ tự duyệt: ${orderString.join(' -> ')}`;
        } else {
            pathResult.textContent = `Không tìm thấy đường đi.`;
            totalCost.textContent = ``;
            traversalOrderElement.textContent = ``;
        }
    } else if (algorithm === 'greedy') {
        var div = document.getElementById("table_result_greedy");
        div.style.visibility = "visible";

        let path = greedyAlgorithm(start, end); // Gọi hàm từ greedy.js
        let pathResult = document.getElementById('pathResult');
        let totalCost = document.getElementById('totalCost');
        let traversalOrderElement = document.getElementById('traversalOrder');

        if (path.length > 0) {
            let pathString = path.join(' -> ');
            let cost = path.reduce((sum, vertex) => sum + (hValues[vertex] || 0), 0); // Tổng h của các đỉnh

            // Hiển thị đường đi
            pathResult.textContent = `Đường đi: ${pathString}`;

            // Hiển thị tổng chi phí
            totalCost.textContent = `Tổng chi phí: ${cost}`;

            // Hiển thị thứ tự duyệt
            let orderString = getTraversalOrderGreedy(); // Lấy thứ tự duyệt từ greedy.js
            traversalOrderElement.textContent = `Thứ tự duyệt: ${orderString.join(' -> ')}`;
        } else {
            pathResult.textContent = `Không tìm thấy đường đi.`;
            totalCost.textContent = ``;
            traversalOrderElement.textContent = ``;
        }
    } else if (algorithm === 'hillClimbing') {  
        var div = document.getElementById("table_result_hill");
        div.style.visibility = "visible";
        let path = hillClimbingAlgorithm(start, end); // Gọi hàm từ hillClimbing.js
        let pathResult = document.getElementById('pathResult');
        let totalCost = document.getElementById('totalCost');
        let traversalOrderElement = document.getElementById('traversalOrder');

        if (path.length > 0) {
            let pathString = path.join(' -> ');
            let cost = path.reduce((sum, vertex) => sum + (hValues[vertex] || 0), 0); // Tổng h của các đỉnh

            // Hiển thị đường đi
            pathResult.textContent = `Đường đi: ${pathString}`;

            // Hiển thị tổng chi phí
            totalCost.textContent = `Tổng chi phí: ${cost}`;

            // Hiển thị thứ tự duyệt
            let orderString = getTraversalOrderHillClimbing(); // Lấy thứ tự duyệt từ hillClimbing.js
            traversalOrderElement.textContent = `Thứ tự duyệt: ${orderString.join(' -> ')}`;
        } else {
            pathResult.textContent = `Không tìm thấy đường đi.`+`Trạng thái hiện tại có thể là một nghiệm tối ưu cục bộ.`;
            totalCost.textContent = ``;
            traversalOrderElement.textContent = ``;
        }
    }
});