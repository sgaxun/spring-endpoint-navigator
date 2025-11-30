package com.example.demo;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.security.access.prepost.PreAuthorize;
import java.util.List;
import java.util.ArrayList;

@RestController
@RequestMapping("/api/products")
public class ComplexBomController {

    /**
     * 查询产品管理列表
     */
    @PreAuthorize("@ss.hasPermi('products:list')")
    @GetMapping("/list")
    public String list()
    {
        // 你的复杂逻辑代码
        List<Long> roleIds = new ArrayList<>();
        roleIds.add(1L);
        return "查询产品管理列表";
    }

    /**
     * 获取产品详细信息
     * @param id 产品唯一标识
     * @return 产品详细信息
     */
    @GetMapping("/detail/{id}")
    public String getDetail(@PathVariable Long id) {
        return "产品详情ID: " + id;
    }

    /**
     * 创建新的产品
     * 接收产品数据并创建新的产品记录
     * @param product 包含产品信息的JSON数据
     * @return 创建结果
     */
    @PostMapping("/create")
    public String createProduct(@RequestBody String product) {
        return "Created Product: " + product;
    }
}