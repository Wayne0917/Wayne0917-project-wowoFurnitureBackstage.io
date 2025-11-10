const apiPath = "wayne0917";
const token = "B5bTsgQRClZ7DCSccCgGV80gj3r1";
const apiUrl = `https://livejs-api.hexschool.io/api/livejs/v1/admin/${apiPath}`;

//------Model層------
let orderData = [];
//Model層-取得訂單資料
async function api_getOrderData() {
    const res = await axios.get(`${apiUrl}/orders`, {
        headers: {
            "Authorization": token,
        },
    });
    orderData = res.data.orders;
    renderOrder(orderData);

    const c3Array = getC3Data(); 
    renderC3(c3Array);
}
api_getOrderData();
//Model層-修改訂單狀態
async function api_updateOrderStatus(orderId, newStatus) {
    const res = await axios.put(`${apiUrl}/orders`,
        {
            data: {
                id: String(orderId),
                paid: newStatus,
            }
        },
        {
            headers: {
                Authorization: token,
            }
        }
    );
    return res.data.orders; // 返回更新後的訂單資料
}
//Model層-清除全部訂單
async function api_delAllOrderData() {
    try {
        const res = await axios.delete(`${apiUrl}/orders`,{
            headers: {
                "Authorization": token,
            },
        })
        orderData = [];
        renderOrder(orderData);
    } 
    catch (error) {
        console.log(`api_delAllOrderData error : ${error}`);
    }
}
//Model層-刪除單筆訂單
async function api_delSingleOrderData(orderId) {
    try {
        const res = await axios.delete(`${apiUrl}/orders/${orderId}`, {
            headers: {
                "Authorization": token,
            },
        })
        orderData.splice(orderId, 1);
        renderOrder(orderData);
    } 
    catch (error) {
        console.log(`api_delSingleOrderData error: ${error}`);
    }

}
//Model層-篩選狀態資料
let filterData =  [];
function getFilterData(status) {
    filterData = orderData.filter((order) => order.paid === status);
    return filterData;
}
//Model層-取得 C3 所需資料（統計產品數量）
function getC3Data(targetOrders = orderData) {
    const c3Data = {};

    targetOrders.forEach(order => {
        order.products.forEach(product => {
        const title = product.title;
        const quantity = product.quantity;

        // 正確的累加邏輯
        if (c3Data[title] === undefined) {
            c3Data[title] = quantity;
        } else {
            c3Data[title] += quantity;
        }
        });
    });

    // ✅ 轉換為 C3 可用格式 [['產品A', 10], ['產品B', 5]]
    const c3Array = Object.entries(c3Data);
    return c3Array;
}


//------View層------
//View層-渲染訂單欄
const orderPageTable = document.querySelector('.orderPage-table');
function renderOrder(orderData) {
    orderPageTable.innerHTML = '';
    
    orderPageTable.innerHTML = `
        <thead>
            <tr>
                <th>訂單編號</th>
                <th>聯絡人</th>
                <th>聯絡地址</th>
                <th>電子郵件</th>
                <th>訂單品項</th>
                <th>訂單日期</th>
                <th>訂單狀態</th>
                <th>操作</th>
            </tr>
        </thead>
    `

    const fragment  = document.createDocumentFragment();

    orderData.forEach( item => {        
        const tr = document.createElement('tr');
        //訂單編號
        const orderNum = document.createElement('td');
        orderNum.textContent = item.id;
        
        //聯絡人
        const userTd = document.createElement('td');
        const userName = document.createElement('p');
        userName.textContent = item.user.name;
        const userPhone = document.createElement('p');
        userPhone.textContent = item.user.tel;

        userTd.append(userName, userPhone);

        //聯絡地址
        const addressTd = document.createElement('td');
        addressTd.textContent = item.user.address;

        //電子郵件
        const emailTd = document.createElement('td');
        emailTd.textContent = item.user.email;

        //訂單品項
        //先拿出訂單品項
        const productTd = document.createElement('td');
        item.products.forEach( product => {
            const productName = document.createElement('p');
            productName.textContent = `${product.title} × ${product.quantity}`;
            productTd.append(productName);
        });
        
        //訂單日期
        const dateTd = document.createElement('td');
        dateTd.textContent = new Date(item.createdAt * 1000).toLocaleDateString();
        
        //訂單狀態
        const statusTd = document.createElement('td');
        const statusBtn = document.createElement('button');
        statusBtn.type = 'button';
        statusBtn.classList.add('statusBtn');
        statusBtn.dataset.id = item.id;
        statusBtn.dataset.status = item.paid;
        statusBtn.textContent = item.paid ? "已處理" : "未處理";

        if (statusBtn.dataset.status === "true") {
            statusBtn.textContent = "已處理";
            statusBtn.style.color = "#00A600";
        } else {
            statusBtn.textContent = "未處理";
            statusBtn.style.color = "#AE0000";
        }

        statusTd.append(statusBtn);

        //操作
        const delTd = document.createElement('td');
        const delBtn = document.createElement("button");
        delBtn.type = 'button';
        delBtn.classList.add('delSingleOrder-Btn');
        delBtn.dataset.id = item.id;
        delBtn.textContent = '刪除';

        delTd.append(delBtn);

        tr.append(orderNum, userTd, addressTd, emailTd, productTd, dateTd, statusTd, delTd);
        fragment.append(tr);

        orderPageTable.append(fragment);
    })
}
// View層-更新單筆訂單狀態按鈕
function updateOrderStatusUI(btn, newStatus) {
    btn.textContent = newStatus ? "已處理" : "未處理";
    btn.dataset.status = newStatus;
    // 設定按鈕樣式和文字
    if (btn.dataset.status === "true") {
        btn.textContent = "已處理";
        btn.style.color = "#00A600";
    } else {
        btn.textContent = "未處理";
        btn.style.color = "#AE0000";
    }
}
//View-層-選染 c3 圖表
function renderC3(c3Array) {     
    const chart = c3.generate({
    bindto: "#chart",
        data: {
            columns: c3Array,
            type : 'pie',
        }
    });
}


//------Controller層------
//Controller層-事件代理-修改訂單
const orderPageList = document.querySelector('.orderPage-list');
orderPageList.addEventListener("click", async (e) => {
    const orderId = e.target.dataset.id;

    //更改訂單狀態
    if (e.target.closest(".statusBtn")) {
        const currentStatus = JSON.parse(e.target.dataset.status);  //先由JSON轉為布林
        const newStatus = !currentStatus;   //反轉狀態

        try {
        // 先更新 UI
        updateOrderStatusUI(e.target, newStatus);
        // 發送 API 請求
        const updatedOrders = await api_updateOrderStatus(orderId, newStatus);
        // 更新本地資料
        orderData = updatedOrders;
        console.log("訂單狀態更新成功");
        } 
        catch (error) {
        // 如果 API 失敗，恢復原狀態
        updateOrderStatusUI(e.target, currentStatus);
        alert("更新失敗，請重試");
        console.error("更新失敗:", error);
        }
    }
    //清除全部訂單
    if (e.target.closest('.discardAllBtn')) {
        await api_delAllOrderData();
        await api_getOrderData();
        const c3Array = getC3Data();
        renderC3(c3Array);
        return; // 結束事件
    }
    //刪除單筆訂單
    if (e.target.closest(".delSingleOrder-Btn")) {
        const orderId = e.target.closest(".delSingleOrder-Btn").dataset.id;
        await api_delSingleOrderData(orderId);
        await api_getOrderData();
        const c3Array = getC3Data();
        renderC3(c3Array);
        return;
    }
});
//Controller層-篩選狀態資料
const filter = document.querySelector('.filter');
filter.addEventListener('change',(e)=>{
    const filterValue = e.target.value;
    let status;

    if (filterValue === "未處理") {
        status = false;
    } else if (filterValue === "已處理") {
        status = true;
    } else {
        // "全部" 的情況
        renderOrder(orderData);
        renderC3(getC3Data());
        return;
    }

    const resultData = getFilterData(status);

    // 如果沒有符合資料，顯示空狀態
    if (resultData.length === 0) {
        document.querySelector(".orderPage-table tbody").innerHTML = `
        <tr>
            <td colspan="8" class="text-center">目前沒有符合的訂單</td>
        </tr>
        `;
    }
    renderOrder(resultData);
    renderC3(getC3Data(resultData));
})












