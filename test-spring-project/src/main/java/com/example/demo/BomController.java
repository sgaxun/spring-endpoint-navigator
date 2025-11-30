package com.example.demo;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequestMapping("/jst/bom")
public class BomController {

    /**
     * 获取BOM清单列表
     * 返回所有物料清单的信息
     */
    @GetMapping("/list")
    public String getBomList() {
        return "BOM List";
    }

    /**
     * 创建新的BOM记录
     * 接收BOM数据并创建新的物料清单
     */
    @PostMapping("/create")
    public String createBom(@RequestBody String bom) {
        return "Created BOM: " + bom;
    }

    /**
     * 查询BOM详细信息
     * 根据ID获取特定BOM的完整信息
     */
    @GetMapping("/detail/{id}")
    public String getBomDetail(@PathVariable String id) {
        return "BOM Detail for ID: " + id;
    }
}