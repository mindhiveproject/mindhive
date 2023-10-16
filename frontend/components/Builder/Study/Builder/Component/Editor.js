import EditComponent from "./Edit";

export default function Editor( { user, task, updateCanvas, close } ) {
  return <EditComponent 
    user={user} 
    task={task} 
    updateCanvas={updateCanvas}
    close={close}
   />;
}
