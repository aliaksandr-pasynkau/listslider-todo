<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

class User extends MY_Controller {

    public function __construct(){
        parent::__construct();
        $this->loader()->model('User_model');
    }

    public function login(){

        $user = new User_Model();
        $userData = $user->read();

        return $userData;
    }
}