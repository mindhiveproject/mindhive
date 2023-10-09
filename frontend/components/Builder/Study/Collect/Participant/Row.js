// import Link from "next/link";
import moment from "moment";
import Download from "./Download";

export default function ResultRow({ studyId, participantId, result }) {

    console.log({ result });

    return <div className="resultItem">

            <div>{result?.study?.title}</div>
            <div>{result?.task?.title}</div>
            <div>Task subtitle</div>
            <div>Task ID</div>
            <div>{moment(result?.createdAt).format("MMMM D, YY, h:mm:ss")}</div>
            <div>{moment(result?.updatedAt).format("MMMM D, YY, h:mm:ss")}</div>
            <div>{result?.dataPolicy}</div>
            <div>Payload type</div>
            <div>{result?.isCompleted}</div>
            <div># Files</div>
            <div># Partial uploads</div>
            <div>Data analysis</div>
            <div>
                <Download dataToken={result?.token} />
            </div>
            <div></div>
    </div>
}

{/* <Link
href={{
    pathname: `/builder/studies`,
    query: {
        selector: studyId,
        tab: `collect`,
        id: participantId,
        data: result?.token
    }
}}
>
<p>see the data</p>
</Link> */}