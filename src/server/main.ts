import express, { Response, Router } from "express";
import { context, createServer, getServerPort } from "@devvit/web/server";
import { FormField, isT1, isT3, T1, T3, UiResponse } from "@devvit/web/shared";
import { handleNuke, handleNukePost } from "./nuke.js";

type NukeFormValues = {
  remove: boolean;
  lock: boolean;
  skipDistinguished: boolean;
  targetId: T1 | T3;
};

const nukeFormFields: FormField[] = [
  {
    type: 'boolean',
    name: "remove",
    label: "Remove comments",
    defaultValue: true,
  },
  {
    type: 'boolean',
    name: "lock",
    label: "Lock comments",
    defaultValue: false,
  },
  {
    type: 'boolean',
    name: "skipDistinguished",
    label: "Skip distinguished comments",
    defaultValue: false,
  },
  {
    type: 'string',
    name: "targetId",
    label: "Target id",
    required: true,
  }
] as const;

const router = Router();

router.post('/internal/menu/mop-comments', (req, res: Response<UiResponse>) => {
  res.json({
    showForm: {
      name: "nukeForm",
      form: {
        title: "Mop Comments",
        fields: nukeFormFields,
        acceptLabel: "Mop",
        cancelLabel: "Cancel",
      },
      data: {
        targetId: req.body.targetId,
      },
    }
  });
});

router.post('/internal/menu/mop-post-comments', async (req, res: Response<UiResponse>) => {
  res.json({
    showForm: {
      name: "nukePostForm",
      form: {
        title: "Mop Post Comments",
        fields: nukeFormFields,
        acceptLabel: "Mop",
        cancelLabel: "Cancel",  
      },
      data: {
        targetId: req.body.targetId,
      }
    }
  });
});

router.post('/internal/forms/nuke', async (req, res: Response<UiResponse>) => {
  const { lock, remove, skipDistinguished, targetId } = req.body as NukeFormValues;

  if (!lock && !remove) {
    res.json({ showToast: "You must select either lock or remove." });
    return;
  }

  if (isT1(targetId)) {
    const result = await handleNuke({
      remove: remove,
      lock: lock,
      skipDistinguished: skipDistinguished,
      commentId: targetId,
      subredditId: context.subredditId
    });
    console.log(`Mop result - ${result.success ? "success" : "fail"} - ${result.message}`);
    res.json({ showToast: `${result.success ? "Success" : "Failed"} : ${result.message}` });
    return;
  } else {
    res.json({ showToast: `Mop failed! Please try again later.` });
  }
});

router.post('/internal/forms/nuke-post', async (req, res: Response<UiResponse>) => {
  const { lock, remove, skipDistinguished, targetId } = req.body as NukeFormValues;

  if (!lock && !remove) {
    res.json({ showToast: "You must select either lock or remove." });
    return;
  }

  if (isT3(targetId)) {
    const result = await handleNukePost({
      remove: remove,
      lock: lock,
      skipDistinguished: skipDistinguished,
      postId: targetId,
      subredditId: context.subredditId
    });
    console.log(`Mop Post result - ${result.success ? "success" : "fail"} - ${result.message}`);
    res.json({ showToast: `${result.success ? "Success" : "Failed"} : ${result.message}` });
    return;
  } else {
    res.json({ showToast: `Mop Post failed! Please try again later.` });
  }
});

const application = express();
application.use(express.json());
application.use(express.urlencoded({ extended: true }));
application.use(express.text());
application.use(router);

const server = createServer(application);
server.on("error", (err) => { console.error(`server error; ${err.stack}`); });
server.listen(getServerPort());
