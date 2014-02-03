<?php


class ApiInput {


    /**
     * @var ApiShuttle
     */
    private $_shuttle;

    private $_input = array();
    private $_URL = array();
    private $_QUERY = array();
    private $_INPUT = array();

    private $_errors = array();

    function __construct (ApiShuttle &$shuttle) {
        $this->_shuttle = $shuttle;
    }

    function error ($inputParamName, $ruleName, array $ruleParams = array(), $statusCode = null) {
        $this->_errors[$inputParamName][$ruleName] = $ruleParams;
        $this->_shuttle->output->status($statusCode);
        return $this;
    }

    function errors () {
        return $this->_errors;
    }

    function pipe (array $names, array $nameMap = array(), $withoutEmpty = true) {
        $values = array();
        foreach ($this->_input as $name => $val) {
            if(isset($nameMap[$name])){
                $name = $nameMap[$name];
            }
            $values[$name] = $val;
        }
        $data = array();
        foreach ($names as $f => $s) {
            if (is_numeric($f)) {
                if(isset($values[$s])){
                    $data[$s] = $values[$s];
                } else if(!$withoutEmpty){
                    $data[$s] = null;
                }
            } else {
                if(isset($values[$f])){
                    $data[$f] = $values[$f];
                } else if(isset($s) || !$withoutEmpty){
                    $data[$f] = $s;
                }
            }
        }
        return $data;
    }

    function argument ($name = null, $default = null) {
        if (is_null($name)) {
            return $this->_INPUT;
        }
        if (isset($this->_INPUT[$name])) {
            return $this->_INPUT[$name];
        }
        return $default;
    }

    function param ($name = null, $default = null) {
        if (is_null($name)) {
            return $this->_URL;
        }
        if (isset($this->_URL[$name])) {
            return $this->_URL[$name];
        }
        return $default;
    }

    function filter ($name = null, $default = null) {
        if (is_null($name)) {
            return $this->_QUERY;
        }
        if (isset($this->_QUERY[$name])) {
            return $this->_QUERY[$name];
        }
        return $default;
    }

    function get ($name = null, $default = null) {
        if (is_null($name)) {
            return $this->_input;
        }
        if (isset($this->_input[$name])) {
            return $this->_input[$name];
        }
        return $default;
    }

    function init ($input, $url, $QUERY){
        $request = $this->_shuttle->api->get(Api::REQUEST);

        if (!empty($request['input']['URL'])) {
            foreach ($request['input']['URL'] as  $index => $param) {
                $value = isset($url[$index]) ? $url[$index] : null;
                if (!is_null($value)) {
                    foreach ($param['filters']['before'] as $filter) {
                        $value = $this->_shuttle->applyFilter($value, $filter["name"], $filter["params"], $param["name"]);
                    }
                    $this->_URL[$param["name"]] = $this->_shuttle->toType($value, $param["type"], $param);
                }
            }
        }

        if (!empty($request['input']['INPUT'])) {
            foreach ($request['input']['INPUT'] as $param) {
                $value = isset($input[$param['name']]) ? $input[$param['name']] : null;
                if (!is_null($value)) {
                    foreach ($param['filters']['before'] as $filter) {
                        $value = $this->_shuttle->applyFilter($value, $filter["name"], $filter["params"], $param['name']);
                    }
                    $this->_INPUT[$param["name"]] = $this->_shuttle->toType($value, $param["type"], $param);
                }
            }
        }

        if (!empty($request['input']['QUERY'])) {
            foreach ($request['input']['QUERY'] as $param) {
                $value = isset($QUERY[$param['name']]) ? $QUERY[$param['name']] : null;
                if (!is_null($value)) {
                    foreach ($param['filters']['before'] as $filter) {
                        $value = $this->_shuttle->applyFilter($value, $filter["name"], $filter["params"], $param['name']);
                    }
                    $this->_QUERY[$param["name"]] = $this->_shuttle->toType($value, $param["type"], $param);
                }
            }
        }
        $this->_input = array_merge($this->_input, $this->_QUERY, $this->_URL, $this->_INPUT);
    }

    function check () {
        $valid = 1;
        $request = $this->_shuttle->api->get(Api::REQUEST);
        if (!empty($request['input']['URL'])) {
            foreach ($request['input']['URL'] as $param) {
                $value = isset($this->_URL[$param['name']]) ? $this->_URL[$param['name']] : null;
                if (!empty($param['validation'])) {
                    $valid *= $this->validate($param["name"], $value, $param['validation'], true);
                }
            }
        }
        if (!empty($request['input']['INPUT'])) {
            foreach ($request['input']['INPUT'] as $param) {
                $value = isset($this->_INPUT[$param['name']]) ? $this->_INPUT[$param['name']] : null;
                if (!empty($param['validation'])) {
                    $valid *= $this->validate($param["name"], $value, $param['validation'], true);
                }
            }
        }
        if (!empty($request['input']['QUERY'])) {
            foreach ($request['input']['QUERY'] as $param) {
                $value = isset($this->_QUERY[$param['name']]) ? $this->_QUERY[$param['name']] : null;
                if (!empty($param['validation'])) {
                    $valid *= $this->validate($param["name"], $value, $param['validation'], true);
                }
            }
        }
        if (!$valid) {
            $this->_shuttle->output->send();
        }
    }

    function applyAfterFilters () {
        $request = $this->_shuttle->api->get(Api::REQUEST);
        if (!empty($request['input']['QUERY'])) {
            foreach ($request['input']['QUERY'] as $param) {
                $value = isset($QUERY[$param['name']]) ? $QUERY[$param['name']] : null;
                if (!is_null($value)) {
                    foreach ($param['filters']['before'] as $filter) {
                        $value = $this->_shuttle->applyFilter($value, $filter["name"], $filter["params"], $param['name']);
                    }
                    $this->_QUERY[$param["name"]] = $this->_shuttle->toType($value, $param["type"], $param);
                }
            }
        }
    }


    function validate($fieldName, $value, array $rules, $setError = false){
        $error  = false;

        $required = !empty($rules["required"]) || empty($rules["optional"]);
        if($required && !$this->_shuttle->applyValidationRule($value, 'required')){
            if ($setError) {
                $this->error($fieldName, 'required', array(), 400);
            }
            $error = true;
        }

        unset($rules["optional"]);
        unset($rules["required"]);

        if (!$error && isset($value) && (strlen((string)$value) || $value === false)) {
            foreach ($rules as $rule) {
                if (!$this->_shuttle->applyValidationRule($value, $rule['name'], $rule["params"], $fieldName)) {
                    if ($setError) {
                        $this->error($fieldName, $rule["name"], $rule['params'], 400);
                    }
                    $error = true;
                    break;
                }
            }
        }
        return !$error;
    }

    function pick () {
        return __::pick($this->_input, func_get_args());
    }

    function omit () {
        return __::omit($this->_input, func_get_args());
    }

    function __get($name){
        return $this->get($name);
    }

}