 <link href="~/Scripts/handsontable/handsontable.full.min.css" rel="stylesheet" />
 <link href="~/Content/handsontable-extend.css" rel="stylesheet" />
 <link href="~/Scripts/select2/css/select2.min.css" rel="stylesheet" />
 <script src="~/Scripts/handsontable-pro/handsontable.full.min.js"></script>
 <script src="~/Scripts/select2/js/select2.full.js"></script>
 <script src="~/Scripts/handsontable-extension/handsontable-select2-editor.js"></script>
 <script src="~/Scripts/lodash.min.js"></script>

<div id="hot"></div>



var isCheckedAll = true;
var hotContainer = document.querySelector('#hot'), hot;

function initHandsontable() {
    hot = new Handsontable(hotContainer, {
        rowHeights: '15px',//行高
        colWidths: '60px',//列宽
        stretchH: 'all', // all 全列按最大宽度展开; none 紧缩的表格; last 最后一列展开
        operateRows: [],
        validataRows: [],
        minSpareRows: 0,
        startRows: 0,
        fixedColumnsLeft: 2,
        autoWrapRow: true,
        rowHeaders: true,// 若为 true, 则行标题从1开始，依次往后
        manualRowResize: true,
        manualColumnResize: true,
        manualRowMove: true,
        manualColumnMove: true,
        autoColumnSize: true,
        contextMenu: {
            items: {
                "copy": { name: '复制(ctrl + c)' },
                "hsep2": "---------",
                "remove_row": { name: '删除行(delete)' },
                "row_below": { name: '新增行(insert)' },
            }
        },
        colHeaders: function (col) {
            if (col == 0) {
                var htmlStr = '<input class="htCheckboxRendererInput checkAll" type="checkbox" ';
                htmlStr += (isCheckedAll ? 'checked="checked"' : '');
                htmlStr += '/>';
                return htmlStr;
            }
        },
        columns: [
            { data: 'IsChecked', type: 'checkbox', colWidths: '50', className: 'htCenter' },
            {
                data: 'AddTime', type: 'date', readOnly: true, colWidths: '145', editor: 'date', title: '时间',
                //validator: function (value, callback) {
                //    if (JDF.isNullOrWhiteSpace(value)) {
                //        return callback(false);
                //    } else {
                //        return callback(true);
                //    }
                //}
            },
            {
                data: 'OrderNo', type: 'text', readOnly: true, colWidths: '110', title: '单号'
            },
            {
                data: 'SubRemark', type: 'text', readOnly: true, colWidths: '70', title: '摘要'
            },
            {
                data: 'SheetType', type: 'text', readOnly: true, title: '单据类型', renderer: customRender
            },
            {
                 data: 'GoodCateID', editor: 'select2', colWidths: '80', title: '商品类别', renderer: customDropdownRenderer,
                    select2Options: {
                    data:  [
                        { id: 'aaa', text: 'default', color: '#ccc' },
                        { id: 'bbb', text: 'primary', color: '#20a0ff' },
                        { id: 'ccc', text: 'success', color: '#13ce66' },
                    ],
                }
            },
            { data: 'Count', type: 'numeric', readOnly: true, title: '数量', renderer: customRender},
            { data: 'GoldWeight', type: 'numeric', readOnly: true, title: '金重', renderer: customRender},
            { data: 'TotalCost', type: 'numeric', readOnly: true, title: '总成本', renderer: customRender},
            { data: 'SettCost', type: 'numeric', readOnly: true, title: '结算成本', renderer: customRender},
            { data: 'SignFee', type: 'numeric', readOnly: true, title: '挂签费', renderer: customRender},
            { data: 'CheckFee', type: 'numeric', readOnly: true, title: '检测费', renderer: customRender},
            { data: 'MateFee', type: 'numeric', readOnly: true, title: '物料金额', renderer: customRender},
            { data: 'NeedGetFee', type: 'numeric', readOnly: true, title: '应收金额', renderer: customRender},
            { data: 'GetFee', type: 'numeric', readOnly: true, title: '收入金额', renderer: customRender},
            { data: 'OutFee', type: 'numeric', readOnly: true, title: '支出金额', renderer: customRender},
            { data: 'TotalGetPayFee', type: 'numeric', readOnly: true, colWidths: '80', title: '累计结欠'},
        ],

        afterChange: function (changes, source) {

            if (source == 'edit') {
                makeDate();
                resetTotalRow();
            }

        },
        afterCreateRow: function (index, amount, source) {//在插入行之前设置单元格默认数据
            this.setDataAtRowProp(index, 'IsChecked', true);
        },
        beforeRemoveRow: function (index, amount, visualRows) {
            var settings = this.getSettings();
            var sourceData = this.getSourceData();
            $.each(visualRows, function (i, key) {
                var model = sourceData[key];
                settings.operateRows = _.remove(settings.operateRows, function (m) { return m[settings.idField] != model[settings.idField] });
                if (model[settings.idField] >= 1) settings.operateRows.push($.extend({}, model, { op_mode: 2 }));
            })
        },
        afterValidate: function (isValid, value, row, prop, source) {
            var settings = this.getSettings();
            if (isValid) {
                _.remove(settings.validataRows, function (m) { return (m.isValid == false && m.row == row && m.prop == prop) });
            } else {
                _.remove(settings.validataRows, function (m) { return (m.row == row && m.prop == prop) });
                settings.validataRows.push({ isValid: isValid, row: row, value: value, prop: prop });
            }
        },

    });

    Handsontable.dom.addEvent(hotContainer, 'mousedown', function (event) {
        if (event.target.nodeName == 'INPUT' && event.target.className == 'htCheckboxRendererInput checkAll') {
            event.stopPropagation();
        }
    });
    Handsontable.dom.addEvent(hotContainer, 'mouseup', function (event) {
        if (event.target.nodeName == 'INPUT' && event.target.className == 'htCheckboxRendererInput checkAll') {
            isCheckedAll = !event.target.checked;
            var sourceData = hot.getSourceData();
            $.each(sourceData, function (i, m) {
                //hot.setDataAtRowProp(i, 'IsChecked', isCheckedAll, 'notBubble');
                if (m.IsTotalRow == true) return false;
                m.IsChecked = isCheckedAll;
            });
            hot.setDataAtRowProp(0, 'IsChecked', isCheckedAll);
            //hot.loadData(sourceData);
            hot.render();
        }
    });
    //模拟双击
    var touchtime = new Date().getTime();
    hot.addHook('afterOnCellMouseDown', function (event, coords, td) {
        if (new Date().getTime() - touchtime < 250) {
            var currentData = hot.getSourceDataAtRow(coords.row);
            var OrderNo = currentData.OrderNo;
            //延迟加载,避免鼠标选中单元格事件
            setTimeout(function () {
                switch (currentData.SheetType) {
                    case "商品入库":
                        window.top.addTab('入库单明细' + OrderNo, OperateUrl.RDetail + "?OrderNo=" + OrderNo, '/Images/FlyAction.png');
                        break;
                    case "商品退货":
                        window.top.addTab('退货单明细' + OrderNo, OperateUrl.TDetail + "?OrderNo=" + OrderNo, '/Images/FlyAction.png');
                        break;
                    case "物料发货":
                        window.top.addTab('物料发货单明细' + OrderNo, OperateUrl.WFDetail + "?ID=0&OrderNo=" + OrderNo, '/Images/FlyAction.png');
                        break;
                    case "物料退货":
                        window.top.addTab('物料退货单明细' + OrderNo, OperateUrl.WTDetail + "?ID=0&OrderNo=" + OrderNo, '/Images/FlyAction.png');
                        break;
                    case "收入":
                        window.top.addTab('收支单明细' + OrderNo, OperateUrl.SZDetail + "?SZFeeOrderNo=" + OrderNo, '/Images/FlyAction.png');
                        break;
                    default:
                }
            },150);

        } else {
            touchtime = new Date().getTime();
        }
    });

    hot.addHook('afterSelectionEnd', function (r, c, r2, c2) {

        // 清除所有扩展的样式
        for (var i = 0; i < hot.countRows(); i++) {
            for (var j = 0; j < hot.countCols(); j++) {
                // 在这里只需移除扩展样式selected-td就行，保留表格原有样式
                var className = hot.getCellMeta(i, j).className;
                if (className && className.lastIndexOf('selected-td') > 0) {
                    var index = className.indexOf('selected-td');
                    hot.setCellMeta(i, j, 'className', className.substring(0, index) + className.substring(index + 1, className.length));
                }
            }
        }
        for (var i = r; i <= r2; i++) {
            for (var j = c; j <= c2; j++) {

                hot.setCellMeta(i, j, 'className','selected-td');
            }
        }
        hot.render();
    })

}

function AddRow() {
    hot.alter("insert_row", hot.getSourceData().length);
}

//扩展select数据渲染
function customDropdownRenderer(instance, td, row, col, prop, value, cellProperties) {
    var selectedId;
    var optionsList = cellProperties.select2Options.data;

    var values = (value + "").split(",");
    var value = [];
    for (var index = 0; index < optionsList.length; index++) {
        if (values.indexOf(optionsList[index].id + "") > -1) {
            selectedId = optionsList[index].id;
            value.push(optionsList[index].text);
        }
    }
    value = value.join(", ");
    $(td).text(value);
    return td;
    //Handsontable.TextCell.renderer.apply(this, arguments);
}
//自定义渲染单元格
var customRender = function (instance, td, row, col, prop, value, cellProperties) {
    //将自定义方法中的配置信息通过hansontable的Text渲染应用到当前window对象上
    Handsontable.renderers.TextRenderer.apply(this, arguments);
    //$(td).text(value);
    td.innerHTML = value;
    if (row > 0) {
        if (value == '收入') {//过滤
            this.szrow = row;
        }
        //不计合计行
        if (NewOrder.length != row) {

            //数据效验改变样式
            if (NewOrder.length > 0 && prop != 'IsChecked' && NewOrder[row][prop] != value && row != this.szrow) {
                $(td).css("background-color", "yellow");
                //console.log(value, NewOrder[row][prop]);
            }
        }
    }
}

//添加统计行
function resetTotalRow() {
    setTimeout(function () {
        var oldData = _.filter(hot.getSourceData(), function (m) { return !m.IsTotalRow; });
        if (oldData.length > 0) {
            var lastRowIndex = oldData.length - 1;
            var totalRow = { IsTotalRow: true };
            var totalRowExist = false, totalRowExistIndex = 0;
            $.each(oldData, function (i, item) {
                if (item.IsTotalRow == true) {
                    totalRowExist = true;
                    totalRowExistIndex = i;
                    return true;
                }
                for (var key in item) {
                    if (key == "AddTime") {
                        totalRow["AddTime"] = '合计';
                        continue;
                    }
                    //不计入统计的列
                    if (key == "OrderNo" || key == "SubRemark" || key == "SheetType" || key == "CateName" || key == "TotalGetPayFee") {
                        totalRow[key] = ""
                        continue;
                    }
                    var value = _.toNumber(item[key]);
                    if (_.isNumber(value) && !_.isNaN(value)) {
                        var oldNumber = (_.toNumber(totalRow[key]) || 0);
                        totalRow[key] = _.toNumber(oldNumber + value).toFixed(2);
                    }
                }
            })
            if (totalRowExist) oldData.splice(totalRowExistIndex, 1);
            totalRow["IsChecked"] = false;
            oldData.push(totalRow);
            hot.loadData(oldData);
        }
    }, 50)
}
//开启or取消控件单元格编辑
var isEdit = true;
var Edit = function () {
    //console.log(hot.getSettings());
    if (isEdit) {
        hot.updateSettings({
            cells: function (row, col, prop) {
                var cellProp = {};

                if (row > 0) {
                    var item = hot.getSourceDataAtRow(row);
                    if (item.SheetType == '商品入库' || item.SheetType == '商品退货') {

                        if (prop == 'SignFee' || prop == 'CheckFee') {
                            cellProp.readOnly = false;
                        }
                    }
                    if (item.SheetType == '物料发货' || item.SheetType == '物料退货') {

                        if (prop == 'MateFee') {
                            cellProp.readOnly = false;
                        }
                    }
                }
                return cellProp;
            }
        })
        isEdit = !isEdit;
        $("#bj").text("取消编辑");
    } else {
        hot.updateSettings({
            cells: function (row, col, prop) {
                var cellProp = {};
                if (col > 0) {
                    cellProp.readOnly = true;
                }
                return cellProp;
            }
        })
        isEdit = !isEdit;
        $("#bj").text("编辑");

    }
}
//处理累计结欠
function makeDate() {
    var sourceData = _.filter(hot.getSourceData(), function (m) { return !m.IsTotalRow; });
    if (sourceData.length > 0) {
        var TotalGetPayFee = sourceData[0].TotalGetPayFee;
        $.each(sourceData, function (index, value) {
            var current = TotalGetPayFee + value.SignFee + value.CheckFee + value.MateFee + value.NeedGetFee - value.GetFee + value.OutFee;
            value.TotalGetPayFee = new Number(current).toFixed(2);
            TotalGetPayFee = current;
        });
    }
}
