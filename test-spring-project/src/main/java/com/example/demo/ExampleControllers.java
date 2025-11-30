package com.example.demo;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.DeleteMapping;

@RestController
@RequestMapping("/example/admin")
public class AdminController {

    /**
     * 获取管理员配置列表
     * 查询所有管理员配置项
     */
    @GetMapping("/list")
    public String getAdminConfigList() {
        return "Admin Config List";
    }

    /**
     * 获取系统状态
     * 返回当前系统运行状态
     */
    @GetMapping("/status")
    public String getSystemStatus() {
        return "System Status";
    }
}

@RestController
@RequestMapping("/example/products")
public class ExampleProductController {

    /**
     * 获取产品管理列表
     * 查询所有产品数据
     */
    @GetMapping("/list")
    public String getProductList() {
        return "Product Management List";
    }

    /**
     * 创建新的产品记录
     * 添加新的产品到系统中
     */
    @PostMapping("/create")
    public String createProduct() {
        return "Created Product";
    }

    /**
     * 删除产品记录
     * 从系统中移除指定的产品
     */
    @DeleteMapping("/delete/{id}")
    public String deleteProduct() {
        return "Deleted Product";
    }
}

@RestController
@RequestMapping("/example/orders")
public class ExampleOrderController {

    /**
     * 获取订单列表
     * 查询所有订单信息
     */
    @GetMapping("/list")
    public String getOrderList() {
        return "Order Management List";
    }

    /**
     * 创建订单
     * 添加新的订单到系统中
     */
    @PostMapping("/create")
    public String createOrder() {
        return "Created Order";
    }
}