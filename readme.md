# 1. Commands

## 1.1 Dependencies. Install next Programs
    nodejs
    npm
    mysqldump
    npm install -g grunt-cli

## 1.2 exec for build node deps and build the project
    npm install

## 1.3 update build:
    npm install
    grunt install build
    grunt install watch

## 1.4 deployment build
    npm install
    grunt build-dev
    grunt build-test
    grunt build-prod

# 2 Описание Api системы
    "REQUEST_METHOD REQUEST_URL [API_VERSION]": {
        "access": {
            "ACCESS_DIRECTIVE_NAME": ACCESS_DIRECTIVE_VALUE
        },
        "request": [
            "[PARAM_TYPE]PARAM_NAME:DATA_TYPE{LENGTH}": ["VALIDATION_RULE"]
        ],
        "response:OUTPUT_TYPE": [
            "OUTPUT_NAME:DATA_TYPE"
        ]
    }
    По данному описанию сгенерируется три json файла:
        для публики - сжатый формат, только необходимый для работы. минимум информации
        для системы - будет читаться системой, содержит расширенную информацию
        для тестирования api - в формате, который воспринимает api-test модуль

## 2.1 Описание Метода
    Каждый public запрос описывается объектом ключ которого является
        "REQUEST_METHOD REQUEST_URL API_VERSION": {}
    для того что бы закрыть какой либо запрос можно указать ! (или любой другой символ который не подходит по шаблону ([A-Z]+)) вначале описания и этот метод не будет обрабатываться

    REQUEST_METHOD
        Стандартные методы http POST, PUT, GET, DELETE, PATCH, HEAD, OPTION
        Обязательный параметр

    REQUEST_URL
        Описывается валидным URL. разделителем сегментов является слэш "/"
        Не должен начинаться и заканчиваться на "/"
        Может содержать вкропления входных параметров начинающихся с $ (будет рассказано далее)
        Обязательный параметр
        не может содержать в себе пробелых символов

    API_VERSION
        Необязательный параметр
        Задается в случае поддержки старых протоколов (клиентов апи).
        Необходимо передача ключа в query-string "api_version"
        Если не указано - то используется последняя версия приложения
        Значение указывается в формате симантического версионирования
            XXX.YYY.ZZZ, например 0.1.3, 13.4.123455
            не должно содержаться нулей в начале числа, если есть другая цифра (не ноль)
        Если текущеая версия апи уже выше, и нет заданного соответсвуюешего апи определения с этой версией, то возьмется существующая 0.1.XXX, отличающаяся только значением последней цифры (patch-version)
        Если и этой нету, то выдастся ошибка входных данных, связанная с устаревшим api протоколом

    Примеры
        "POST user/login"
        "POST todo/$list_id/item/$item_id"
        "POST todo/$list_id/item/$item_id 11.2.33"

## 2.2 Описание параметров запроса
    Каждый вложенное описание назвается директивой, их может быть много. Они не могут повторяться внутри описания одного запроса
    Зарезервированны следующие директивы
        request
        response
        access
        handler
        man_url

### 2.2.1 request
Каждое входное значение может быть задано в форме

    "[PARAM_TYPE]PARAM_NAME:DATA_TYPE{LENGTH}#BEFORE_FILTER*AFTER_FILTER": "VALIDATION_RULE|VALIDATION_RULE"

или валидация может быть заданна в виде массива

    "[PARAM_TYPE]PARAM_NAME:DATA_TYPE{LENGTH}#BEFORE_FILTER*AFTER_FILTER": ["VALIDATION_RULE", "VALIDATION_RULE"]

или развернутый вариант (он в strict_mode = только так)

    "[PARAM_TYPE]PARAM_NAME:DATA_TYPE{LENGTH}": {
        "before": ["BEFORE_FILTER", "BEFORE_FILTER"],
        "rules": ["VALIDATION_RULE", "VALIDATION_RULE"],
        "after": ["AFTER_FILTER", "AFTER_FILTER"]
    }

#### PARAM_TYPE
Есть три типа входных данных:

* **[query]** - знак @. Приходит из Query-string-params (в урл запроса после "?").
Есть следующий список исключенных значений для имен query:

    API_VERSION,
    api_version,
    API_OUTPUT_FORMAT,
    API_INPUT_FORMAT,
    api_input_format,
    api_output_format


* **[url]**    - знак $
    приходит из урл запроса в случае если заданы в имени описания


* **[input]**  - знак > его можно не писать вообще, все данные без обозначения = [input].
    приходит в боди запроса. Соответсвтенно нету в GET запросе.

#### PARAM_NAME
    Названия могут содержать только следующие символы, заданные шаблоном ([a-zA-Z0-9_]+)

#### DATA_TYPE
    Тип данных нужен для приведения к нему входного значения
    Если тип данных не указан - то по умолчанию это string
    Доступны следующие типы данных:
        :text - строка, по умолчанию не имеет ограничений по длине и не производится никаких процедур для приведения к формату
        :string - не может привышать длинной 255 символов (если не задано другого  в параметрах), убираются все пробельные символы (\s) в начале и конце строки (trim)
        :integer - целочиселнное значение. только цифры и знак.
        :decimal - целочиселнное значение. только цифры. без знака
        :float - число с плавающей точкой. только цифры, знак и точка (а не запятая). также воспринимается и формат "-0.2e-10"
        :boolean - преобразуется в булевское значение. Пустая строка, 0, '0' преобразуются в FALSE
    Для числовых типов по умолчанию не происходит trim и нет ограничения по длине. Но есть ограничение по формату

#### LENGTH
    Длина входного значения.
    После записи типа данных может быть описано длина входных данных. при этом можно описывать :
        {30} - жесткое соответствие длине строки
        {1,30} - длина от 1 до 30
        {4,} - длина должна быть от 4 до бесконечности
        {,50} - длина должна быть ограничена 50-ю символами
    В случае числовых типов знак "-" будет учитываться в длине строки. все положительные знчения не имеют знака.
    по типу данных и длине производится валидация correct['DATA_TYPE','LENGTH'].
    В случае не корректно введенных данных - вернется ощибка "correct" и параметрами

#### BEFORE_FILTER
    Это перечисление последовательности процедур для приведение к нужному формату
    Все :string получают автоматически trim и xss фильтры
    Доступны
        trim
        xss
        to_string
        to_integer
        to_boolean
        to_float
        camelcase
        underscorecase
        dashcase
        capitalize
        uppercase
        lowercase

#### AFTER_FILTER
    Это закрытое свойство. в компилируемом открытом апи этого не будет указано.
    Это перечисление постфильтров для параметра.
    Производятся после всех валидаций
    доступны все BEFORE_FILTER фильтры, а также
        password - реализуется системой
        key('SOME') - переназывает ключ
        и другие, которые написаны в системе.

#### VALIDATION_RULE
    Правила валидации могут быть как встроенные в систему, так и добавленные специально для необходимого модуля
    Обязательные правила только: optional и required - они не могут быть заданы одновременно. В случае если не задан ни один - по умолчанию это означает 'required'
    Правила могут записываться как в форме массива, так и в форме сплошной строки, правила при этом разделяются вертикальной чертой "|"
    Правила могут иметь параметры, при этом параметры записываются в JSON строки. Значения не должны содержать одиночных ковычек. Знак одиночной ковычки используются как алиас для экраниования двойной ковычки
    примеры правил:
        required
        need
        matches['inputName']
        min_length['value']
        max_length['value']
        exact_length['value']
        alpha
        alpha_numeric
        alpha_dash
        numeric
        integer
        decimal
        is_natural
        is_natural_no_zero
        valid_base64
        valid_email
        valid_url
        valid_date
        unique"

#### Примеры
    "$user_id:number{1,11}#trim": "required|exists"
    "@is_active:boolean": "optional"
    "password:string{6,25}": "optional"
    ">view_name:string{3,30}#trim": "required"
    "last_name:string{3,30}#trim": "required"
    "first_name:string{3,30}#trim": ["required"]

    Система не должна взять больше параметров чем заявлено в описании. если взяла - то это баг

### 2.2.2 Response

    формат описания выходных данных
        "response:FORMAT({LIMIT,MAX_LIMIT}PAGE_NUMBER)": [
            "OUTPUT_PARAM_NAME:DATA_TYPE",
            "OUTPUT_PARAM_NAME:DATA_TYPE"
        ]
    или
        "response:FORMAT({LIMIT,MAX_LIMIT}PAGE_NUMBER)": {
            data: [
                "OUTPUT_PARAM_NAME:DATA_TYPE",
                "OUTPUT_PARAM_NAME:DATA_TYPE"
            ],
            meta: [
                "META_NAME:DATA_TYPE",
                "META_NAME:DATA_TYPE"
            ]
        }

    FORMAT
        есть только несколько типов
            :one - отдаст только один обьект (самый первый, в случае если будут выводится системой несколько...)
            :many - отдаст массив объект, по умолчанию ограничен 255 объектами (MAX_LIMIT = 255)
        По умолчанию :one

    {LIMIT,MAX_LIMIT}
        Ограничения задаются в формате схожим с длинной входного поля {MIN,MAX}
        Вместо всего элемента может указано только число, говорящее о максимально допустимом значении выдаваемых объектов (MAX_LIMIT)

    LIMIT
        говорит сколько нужно получить элементов (максимальное количество элементов в массиве данных)
        для задания LIMIT необходимо обязательно задать FORMAT :many
        Задается
            или имя входного параметра вместе с PARAM_TYPE (@,$,>)
            или число, которое нельзя изменить (при этом второй параметр MAX_LIMIT игнорируется)
        LIMIT по умолчанию не задан равен MAX_LIMIT
        это может быть только :decimal тип

    MAX_LIMIT
        Задается в случае если необходимо ограничить количество выдаваемых элементов. по умолчанию задан как 255
        для задания MAX_LIMIT необходимо обязательно задать FORMAT :many
        MAX_LIMIT по умолчанию равен 255
        это может быть только :decimal тип

    PAGE_NUMBER
        По умолчанию не задан как 1 и отдает все на одной станице
        для задания PARAM_FILTER необходимо обязательно задать FORMAT :many
        Задается имя входного параметра вместе PARAM_TYPE (@,$,>)
        это может быть только :decimal тип

### 2.2.3 Access
    Задается параметрами системы.
    only_owner: true - можно изменить в случае если залогинен и user_id равен user_id создателя записи.
    need_login: true - необходимо авторизоваться

## 2.3 Описание входных и выходных форматов

    API_OUTPUT_FORMAT
        необязательный ключ query-string, говорит в каком виде вернуть данные, по умолчанию json
        Если заданы в заголовки accept - то берет оттуда если назадан жестко query-string
        доступны:
            xml
            json

    API_INPUT_FORMAT
        Необязательный ключ query-string, говорит в каком типе понимать входные данные
        Если не задан система сама будет искать в боди json вначале, если будет ошибка, то будет брать параметры в формате key=value&key=value
        в случае неудачи может вернуться ошибка валидации входных данных
        доступны:
            param
            xml
            json


## 2.4 ПРИМЕР ОПИСАНИЯ
    "PUT user/$id": {
        "access": {
            "need_login": true,
            "only_owner": true
        },
        "request" : {
            "$id:integer": "optional|exists",
            "username:string": "optional|need['password_old']|unique",
            "email:string": "required|valid_email|unique|need['password_old']",
            "password_old:string": "optional|valid_password",
            "password_new:string": "optional|matches['password_new_confirm']|need['password_old']",
            "password_new_confirm:string": "optional|matches['password_new']|need['password_old']"
        },
        "response": [
            "id:integer",
            "username:string",
            "email:string"
        ]
    },