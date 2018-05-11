<?php
//Create an entry
$randomID = generateRandomString(32);
$target_dir = "custom_configs/".$randomID."/";

$json_obj = file_get_contents('php://input');
if(strlen($json_obj)>20000) {
	//Larger than max
	ConstructJSON("2","The file you tried to upload was too long. <b>If you actually need more space, tell me.</b> Upload did not complete.","","","");
	die();
}
if(strlen($json_obj)<20) {
	//Larger than max
	ConstructJSON("3","The file you tried to upload too small to be useful. Something might've gone wrong. Tell me somehow.","","","");
	die();
}


$json = json_decode($json_obj);

if($json->uuid != null) {
	//Oh! We're using JSON.
	//Try and authenticate the user.
	$response = TestAPIKey($json->uuid,$json->apiKey);
	if($response>0) {
		//Authorized! Change the file.
		$target_dir = "custom_configs/".$json->uuid."/";
		$target_file = $target_dir . "android/v3/1404";
		$target_file_ios = $target_dir . "api/config/ios/v3/207";
		$target_file_raw = $target_dir . "raw";
		//Overwrite
		data_to_file($json->data,$target_file,"android");
		data_to_file($json->data,$target_file_ios,"ios");
		data_to_file($json->data,$target_file_raw,"%%platform%%");
		ConstructJSON("0","",$target_dir, $json->uuid, $json->apiKey);
		die();
		
		
	} else {
		//Not authorized
		ConstructJSON("7","Failed to edit config because of an auth error.","","","");
		die();
	}
	
}



$oldmask = umask(0);  // helpful when used in linux server  
//Create our directory layout
mkdir ($target_dir, 0700);
mkdir ($target_dir."android", 0700);
mkdir ($target_dir."android/v3", 0700);
mkdir ($target_dir."api", 0700);
mkdir ($target_dir."api/config", 0700);
mkdir ($target_dir."api/config/ios", 0700);
mkdir ($target_dir."api/config/ios/v3", 0700);

$target_file = $target_dir . "android/v3/1404";
$target_file_ios = $target_dir . "api/config/ios/v3/207";
$target_file_raw = $target_dir . "raw";

data_to_file($json->data,$target_file,"android"); //Android
data_to_file($json->data,$target_file_ios,"ios"); //iOS
data_to_file($json->data,$target_file_raw,"%%platform%%"); //Raw

//Construct output JSON
$apiKey = ObtainAPIKey($randomID);
ConstructJSON("0","",$target_dir, $randomID, $apiKey);


function ConstructJSON($errorCode, $errorText, $outputLocation, $outputUUID, $apiKey) {
	$output = "{\"errorCode\":\"".$errorCode."\",\"errorText\":\"".$errorText."\",\"outputLocation\":\"".$outputLocation."\",\"uniqueId\":\"".$outputUUID."\",\"apiKey\":\"".$apiKey."\"}";
	echo $output;
}

function generateRandomString($length = 10) {
    $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    $charactersLength = strlen($characters);
    $randomString = '';
    for ($i = 0; $i < $length; $i++) {
        $randomString .= $characters[rand(0, $charactersLength - 1)];
    }
    return $randomString;
}

function data_to_file($data_string, $output_file, $platform) {
    //Convert our data to a file.
	//Delete it first
	unlink($output_file);
	$filStream = fopen($output_file, "w") or FailToCreateFile();
	$data = base64_decode($data_string); #Decode Base64
	$androidData = str_replace("%%platform%%",$platform,$data);
	fwrite($filStream, $androidData);
	fclose($filStream);
    return $output_file; 
}

function FailToCreateFile() {
	ConstructJSON("7","Failure while opening file.","","","");
	die();
}

function ConnectToSQL() {
	$servername = "localhost";
	$username = "remoteuser";
	$password = "INSERT YOUR PASSWORD HERE!";
	// Create connection
	$conn = new mysqli($servername, $username, $password);

	// Check connection
	if ($conn->connect_error) {
		ConstructJSON("4","SQL Connection Error. File could not be uploaded. Let me know about this, please!","","","");
		die();
	}
	return $conn;
}

function SendSQLRequest($conn, $SQLQuery) {
	$result = $conn->query($SQLQuery);
	$error = $conn->error;
	if(strlen($error)>1) {
		//Error. Die.
		ConstructJSON("5","Generic SQL error caused an upload failure. Let me know about this, please!","","","");
		die();
	}
	return $result;
}

function ObtainAPIKey($unique) {
	$conn = ConnectToSQL();
	$token = generateRandomString(44);
	$SQLQuery = 'INSERT INTO pbl_config.configs (config_uuid , auth_token) VALUES("'.$unique.'","'.$token.'");';
	$response = SendSQLRequest($conn, $SQLQuery);
	return $token;
}

function TestAPIKey($uuid,$auth) {
	$conn = ConnectToSQL();
	//Escape UUID
	$uuid = $conn->real_escape_string($uuid);
	$token = generateRandomString(44);
	$SQLQuery = 'SELECT COUNT(auth_token) FROM pbl_config.configs WHERE config_uuid="'.$uuid.'" and auth_token = "'.$auth.'";';
	$response = (int)SendSQLRequest($conn, $SQLQuery);
	return $response;
}
?>